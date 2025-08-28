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
import Link from "next/link";

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

interface InteractionStats {
  currentMonth: number;
  limit: number | null;
  remaining: number | null;
  hasUnlimited: boolean;
}

type ChatTheme = 'light' | 'dark';

export function PublicChat({ chatTheme = 'light' }: { chatTheme?: ChatTheme }) {
  const isDarkTheme = chatTheme === 'dark';
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
      console.error("Full error object from useChat hook:", error);

      // We will create a user-friendly message without trying to parse JSON.
      const displayMessage = `An error occurred. Please check the console for details.`;
      toast.error(displayMessage);
    },
    onFinish: () => {
      // Refresh stats after each completed assistant message
      void fetchInteractionStats();
    },
  });

  const [image, setImage] = useState<string | null>(null);
  const [document, setDocument] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<InteractionStats | null>(null);
  const hasUnlimited = !!stats?.hasUnlimited;
  const remaining = stats?.remaining ?? null;
  const isAtLimit = !hasUnlimited && remaining !== null && remaining <= 0;

  const fetchInteractionStats = async () => {
    try {
      const res = await fetch('/api/user/interaction-limit', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStats(data as InteractionStats);
      }
    } catch (e) {
      // ignore fetch errors for UX
    }
  };

  // Auto-scroll to the bottom of the chat on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Record chat session start and load interaction stats
  useEffect(() => {
    recordChatStart();
    if (session?.user?.email) {
      void fetchInteractionStats();
    }
  }, [session]);

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

    // Block sending if user reached the interaction limit
    if (isAtLimit) {
      toast.error("You've reached your monthly interaction limit. Please upgrade your plan.");
      // Optionally show a helper message in the chat
      const limitMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "You've reached your monthly interaction limit. Please upgrade your plan to continue using this AI Health Consultant.\n\n[Upgrade Now](/plans)",
      };
      append(limitMessage);
      return;
    }

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
      <div className={`mx-auto w-full max-w-full sm:max-w-2xl md:max-w-3xl rounded-xl border shadow-lg ${
        isDarkTheme ? 'bg-[#0b1220] border-[#1b2a4a] text-[#e7ecf5]' : 'bg-white dark:bg-gray-950'
      }`}>
        <div className={`p-3 border-b ${isDarkTheme ? 'border-[#1b2a4a]' : 'border-gray-200 dark:border-gray-800'}`}>
          {stats && !hasUnlimited && (
            <div className="flex items-center justify-between text-sm">
              <span className={`${isDarkTheme ? 'text-[#c9d2e2]' : 'text-gray-600 dark:text-gray-400'}`}>
                {`Usage: ${stats.currentMonth} / ${stats.limit ?? '∞'} interactions`}
              </span>
              <button
                className={`${isDarkTheme ? 'text-[#7ae2ff]' : 'text-teal-600'} hover:underline disabled:opacity-50`}
                onClick={() => fetchInteractionStats()}
                disabled={isLoading}
              >
                Refresh
              </button>
            </div>
          )}
        </div>

        {isAtLimit && (
          <div className={`mx-4 mt-4 rounded-md p-3 text-sm ${isDarkTheme ? 'bg-red-900/40 text-red-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
            <p className="text-red-800 dark:text-red-200">
              You&apos;ve reached your monthly interaction limit. Please upgrade to continue.
              {" "}
              <Link href="/plans" className="underline font-medium">Upgrade plan</Link>
            </p>
          </div>
        )}

        <div ref={chatContainerRef} className="p-3 md:p-4 h-[65vh] md:h-[32rem] overflow-y-auto space-y-4">
          {uiMessages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
              {message.role === "assistant" && (
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                  isDarkTheme ? 'bg-[#0f1b2d] text-[#a8c1ff] border border-[#1b2a4a]' : 'bg-teal-500 text-white'
                }`}>AI</div>
              )}
              <div className={`rounded-lg p-3 max-w-[75%] ${message.role === "user" ? (
                isDarkTheme ? 'bg-[#8b5cf6] text-white' : 'bg-teal-500 text-white'
              ) : (
                isDarkTheme ? 'bg-[#0f1b2d] text-[#e7ecf5]' : 'bg-gray-100 dark:bg-gray-800'
              )}`}>
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
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkTheme ? 'text-[#e7ecf5]' : 'text-gray-900'}`}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-white">{message.content}</p>
                  )
                )}
              </div>
            </div>
          ))}
           {isLoading && (
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${isDarkTheme ? 'bg-[#0f1b2d] text-[#a8c1ff] border border-[#1b2a4a]' : 'bg-teal-500 text-white'}`}>AI</div>
                <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-[#0f1b2d]' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className={`p-3 md:p-4 border-t ${isDarkTheme ? 'border-[#1b2a4a] bg-[#0b1220]' : 'bg-white dark:bg-gray-950'}`}>
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
            <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isAtLimit}>
              <PaperclipIcon className="w-5 h-5" />
            </Button>
            <Input
              className={`flex-1 ${isDarkTheme ? 'bg-[#0f1b2d] text-[#d6e4ff] placeholder-[#7d8aa6] border-[#1b2a4a]' : 'bg-white dark:bg-gray-800'}`}
              placeholder={isAtLimit ? "Interaction limit reached. Upgrade to continue..." : "Type your message..."}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isLoading && !isAtLimit) {
                  handleSubmit(e as any);
                }
              }}
              disabled={isLoading || isAtLimit}
            />
            <Button
              type="submit"
              aria-label="Send message"
              disabled={isLoading || isAtLimit || (!input.trim() && !image && !document)}
              className={`${isDarkTheme ? 'bg-[#8b5cf6] hover:bg-[#7c4fe0]' : 'bg-teal-500 hover:bg-teal-600'} text-white rounded-full ${isDarkTheme ? 'w-10 h-10 p-0' : ''}`}
            >
              <SendIcon className="w-5 h-5" />
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

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}