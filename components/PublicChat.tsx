"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat, Message as AIMessage } from "ai/react";
import { v4 as uuidv4 } from "uuid";
import toast, { Toaster } from "react-hot-toast";
import * as pdfjsLib from "pdfjs-dist";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { recordChatStart } from "@/lib/client/usage";
import ReactMarkdown from 'react-markdown';
import { useSession } from "next-auth/react";

// Configure the worker for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Define a custom message type that includes our optional image property
interface Message extends AIMessage {
  image?: string;
  document?: {
    name: string;
    content: string;
  }
}

export function PublicChat() {
  const { data: session } = useSession();
  
  // Store initial messages in state to prevent re-creation on every render
  const [initialMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: "assistant",
      content: "Hi there! Ask me a medical question to see how I can help.",
    },
  ]);

  const { messages, input, handleInputChange, append, isLoading, setInput, error } = useChat({
    api: "/api/chat",
    initialMessages,
    // This onError handler logs the full error object to the console,
    // which is crucial for debugging client-side issues with the stream.
    onError: (error) => {
      // Log the entire error object to the console to inspect its structure.
      // This will show us exactly what the backend is sending on failure.
      console.error("Full error object from useChat hook:", error);

      // Check if this is an interaction limit error
      if (error.message && error.message.includes('INTERACTION_LIMIT_REACHED')) {
        // Parse the error response to get details
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.error === 'INTERACTION_LIMIT_REACHED') {
            // Add a system message to the chat about the limit
            const limitMessage: Message = {
              id: uuidv4(),
              role: "assistant",
              content: `🚫 **Interaction Limit Reached**

You've reached your monthly interaction limit for the **${errorData.plan}** plan.

**Current Usage:** ${errorData.limit - (errorData.remainingInteractions || 0)}/${errorData.limit} interactions

**To continue using the AI Health Consultant, please upgrade your plan:**

- **Basic Plan:** 50 interactions/month
- **Premium Plan:** Unlimited interactions

[Upgrade Now](/plans)`,
            };
            
            // Add the limit message to the chat
            append(limitMessage);
            
            // Show a toast notification
            toast.error("Interaction limit reached. Please upgrade your plan to continue.");
            return;
          }
        } catch (parseError) {
          console.error('Error parsing interaction limit error:', parseError);
        }
      }

      // We will create a user-friendly message without trying to parse JSON.
      // The real details will be in the developer console.
      const displayMessage = `An error occurred. Please check the console for details.`;
      toast.error(displayMessage);
    },
    onFinish: (message) => {
      console.log("Chat message finished:", message);
    },
  });

  const [image, setImage] = useState<string | null>(null);
  const [document, setDocument] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Record chat session start
  useEffect(() => {
    recordChatStart();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setImage(null);
    setDocument(null);

    const fileType = file.type;
    if (fileType.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else if (fileType === "application/pdf") {
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => (item as any).str).join(" ");
              fullText += pageText + "\n";
            }
            setDocument({
              name: file.name,
              content: fullText.trim(),
            });
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error reading PDF:", error);
        toast.error("Error reading PDF file. Please try again.");
      }
    } else {
      toast.error("Unsupported file type. Please upload an image or PDF.");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && !image && !document) {
      return;
    }

    // This message object is for the optimistic UI update.
    // It needs to have the image/document property to be rendered correctly.
    const messageToAppend: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
    };

    if (image) {
        messageToAppend.image = image;
    }

    if (document) {
        messageToAppend.document = document;
    }

    // The custom data (image/document) is passed in the `body` of the options argument.
    // This is what the backend will receive.
    const appendOptions = { body: {} as { image?: string; document?: string } };
    if (image) {
      appendOptions.body.image = image;
    }
    if (document) {
      appendOptions.body.document = document.content;
    }

    append(messageToAppend, appendOptions);

    // Clear the image preview and file input after sending
    setImage(null);
    setDocument(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setInput(""); // Clear the input field
  };

  // Cast the messages to our custom type to access image/document properties
  const uiMessages = messages as Message[];

  return (
    <>
      <Toaster position="top-center" />
      <div className="mx-auto w-full max-w-3xl rounded-xl border bg-white dark:bg-gray-950 shadow-lg">
        <div ref={chatContainerRef} className="p-4 h-[32rem] overflow-y-auto space-y-4">
          {uiMessages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
              {message.role === "assistant" && (
                <div className="w-8 h-8 shrink-0 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">AI</div>
              )}
              <div className={`rounded-lg p-3 max-w-[75%] ${message.role === "user" ? "bg-teal-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                {message.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={message.image} alt="user upload" className="rounded-md mb-2 max-w-full h-auto" />
                )}
                {message.document && (
                  <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-md mb-2">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{message.document.name}</p>
                    </div>
                  </div>
                )}
                {message.content && (
                  message.role === "assistant" ? (
                    <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )
                )}
              </div>
            </div>
          ))}
           {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">AI</div>
                <div className="rounded-lg p-3 bg-gray-100 dark:bg-gray-800">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white dark:bg-gray-950">
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
            <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              <PaperclipIcon className="w-5 h-5" />
            </Button>
            <Input
              className="flex-1 bg-white dark:bg-gray-800"
              placeholder="Type your message..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                  handleSubmit(e as any);
                }
              }}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || (!input.trim() && !image && !document)} className="bg-teal-500 hover:bg-teal-600 text-white">
              Send
            </Button>
          </div>
          <div className="flex items-center justify-center pt-2">
            <LockIcon className="w-3 h-3 text-gray-400 mr-1.5" />
            <p className="text-xs text-gray-500 dark:text-gray-400">HIPAA-Private chat</p>
          </div>
        </form>
      </div>
    </>
  );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function PaperclipIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
      />
    </svg>
  );
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
} 