"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat, Message as AIMessage } from "ai/react";
import { v4 as uuidv4 } from "uuid";
import toast, { Toaster } from "react-hot-toast";
import * as pdfjsLib from "pdfjs-dist";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  // Store initial messages in state to prevent re-creation on every render
  const [initialMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: "assistant",
      content: "Hi there! Ask me a medical question to see how I can help.",
    },
  ]);

  const { messages, input, handleInputChange, append, isLoading, setInput } = useChat({
    api: "/api/chat",
    initialMessages,
    onError: (error) => {
      try {
        // The error message from the AI SDK is a JSON string.
        const errorData = JSON.parse(error.message);
        // Display the detailed error from our custom backend response.
        const displayMessage = `Error: ${errorData.details || 'An unknown error occurred.'}`;
        toast.error(displayMessage);
        console.error("Detailed error from backend:", errorData);
      } catch (e) {
        // If parsing fails, fall back to the generic message.
        toast.error(`An error occurred: ${error.message}`);
        console.error("Error in useChat hook (could not parse JSON):", error);
      }
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
              fullText += pageText + "\n\n";
            }
            setDocument({ name: file.name, content: fullText });
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error parsing PDF:", error);
        toast.error("Failed to parse PDF file.");
      }
    } else {
      toast.error("Unsupported file type. Please upload an image or a PDF.");
      return;
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
                {message.content && <p className="text-sm">{message.content}</p>}
              </div>
            </div>
          ))}
           {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">AI</div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex items-center space-x-1.5 h-[38px]">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <div className="relative">
             {image && (
              <div className="absolute bottom-14 left-0 w-full p-2">
                <div className="relative inline-block">
                  <img src={image} alt="preview" className="w-20 h-20 rounded-md object-cover" />
                  <button type="button" onClick={() => setImage(null)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    &times;
                  </button>
                </div>
              </div>
            )}
            {document && (
                <div className="absolute bottom-14 left-0 w-full p-2">
                    <div className="relative inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 p-2 rounded-md">
                        <FileTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{document.name}</p>
                        <button type="button" onClick={() => setDocument(null)} className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                            &times;
                        </button>
                    </div>
                </div>
            )}
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
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function PaperclipIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
} 