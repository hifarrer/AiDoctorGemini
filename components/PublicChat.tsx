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
  };
  healthReport?: {
    id: string;
    title: string;
    reportType: string;
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    riskLevel: string;
  };
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
  const [healthReport, setHealthReport] = useState<{
    id: string;
    title: string;
    reportType: string;
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    riskLevel: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
    setHealthReport(null);

    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    // Check if this looks like a health report
    const isHealthReport = fileName.includes('lab') || 
                          fileName.includes('blood') || 
                          fileName.includes('test') || 
                          fileName.includes('result') || 
                          fileName.includes('exam') || 
                          fileName.includes('report') || 
                          fileName.includes('medical') ||
                          fileName.includes('health') ||
                          fileName.includes('diagnosis') ||
                          fileName.includes('scan') ||
                          fileName.includes('xray') ||
                          fileName.includes('mri') ||
                          fileName.includes('ct');

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
        setIsAnalyzing(true);
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
            
            const content = fullText.trim();
            
            if (isHealthReport) {
              // Analyze as health report
              await analyzeHealthReport(file.name, content, file);
            } else {
              // Treat as regular document
              setDocument({
                name: file.name,
                content: content,
              });
            }
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error reading PDF:", error);
        toast.error("Error reading PDF file. Please try again.");
        setIsAnalyzing(false);
      }
    } else {
      toast.error("Unsupported file type. Please upload an image or PDF.");
    }
  };

  const analyzeHealthReport = async (filename: string, content: string, file: File) => {
    try {
      // Determine report type based on filename and content
      const reportType = determineReportType(filename, content);
      
      // Call analysis API
      const response = await fetch('/api/health-reports/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          reportType,
          filename
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze health report');
      }

      const analysis = await response.json();
      
      // Save the health report
      const saveResponse = await fetch('/api/health-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: filename.replace(/\.[^/.]+$/, ""), // Remove file extension
          reportType,
          originalFilename: filename,
          fileContent: content,
          fileSize: file.size,
          mimeType: file.type,
          aiAnalysis: analysis.analysis,
          aiSummary: analysis.summary,
          keyFindings: analysis.keyFindings,
          recommendations: analysis.recommendations,
          riskLevel: analysis.riskLevel
        })
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save health report');
      }

      const savedReport = await saveResponse.json();
      
      setHealthReport({
        id: savedReport.healthReport.id,
        title: savedReport.healthReport.title,
        reportType: savedReport.healthReport.report_type,
        summary: savedReport.healthReport.ai_summary,
        keyFindings: savedReport.healthReport.key_findings,
        recommendations: savedReport.healthReport.recommendations,
        riskLevel: savedReport.healthReport.risk_level
      });

      toast.success('Health report analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing health report:', error);
      toast.error('Failed to analyze health report. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const determineReportType = (filename: string, content: string): string => {
    const lowerFilename = filename.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    if (lowerFilename.includes('lab') || lowerContent.includes('laboratory') || lowerContent.includes('blood test')) {
      return 'lab_results';
    } else if (lowerFilename.includes('exam') || lowerContent.includes('examination') || lowerContent.includes('physical exam')) {
      return 'exam_results';
    } else if (lowerFilename.includes('scan') || lowerFilename.includes('mri') || lowerFilename.includes('ct') || lowerFilename.includes('xray')) {
      return 'imaging';
    } else if (lowerContent.includes('diagnosis') || lowerContent.includes('medical report')) {
      return 'medical_report';
    } else {
      return 'general_report';
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

    if (!input.trim() && !image && !document && !healthReport) {
      return;
    }

    // This message object is for the optimistic UI update.
    // It needs to have the image/document/healthReport property to be rendered correctly.
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

    if (healthReport) {
      messageToAppend.healthReport = healthReport;
    }

    // The custom data (image/document/healthReport) is passed in the `body` of the options argument.
    // This is what the backend will receive.
    const appendOptions = { body: {} as { image?: string; document?: string; healthReport?: any } };
    if (image) {
      appendOptions.body.image = image;
    }
    if (document) {
      appendOptions.body.document = document.content;
    }
    if (healthReport) {
      appendOptions.body.healthReport = healthReport;
    }

    append(messageToAppend, appendOptions);

    // Clear the image preview and file input after sending
    setImage(null);
    setDocument(null);
    setHealthReport(null);
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
        isDarkTheme ? 'bg-[#0b1220] border-[#1b2a4a] text-[#e7ecf5]' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <div className={`p-3 border-b ${isDarkTheme ? 'border-[#1b2a4a]' : 'border-gray-200'}`}>
          {stats && !hasUnlimited && (
            <div className="flex items-center justify-between text-sm">
              <span className={`${isDarkTheme ? 'text-[#c9d2e2]' : 'text-gray-600'}`}>
                {`Usage: ${stats.currentMonth} / ${stats.limit ?? '∞'} interactions`}
              </span>
              <button
                className={`${isDarkTheme ? 'text-[#7ae2ff]' : 'text-blue-600'} hover:underline disabled:opacity-50`}
                onClick={() => fetchInteractionStats()}
                disabled={isLoading}
              >
                Refresh
              </button>
            </div>
          )}
        </div>

        {isAtLimit && (
          <div className={`mx-4 mt-4 rounded-md p-3 text-sm ${isDarkTheme ? 'bg-red-900/40 text-red-200' : 'bg-red-100 text-red-800'}`}>
            <p className={isDarkTheme ? 'text-red-200' : 'text-red-800'}>
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
                  isDarkTheme ? 'bg-[#0f1b2d] text-[#a8c1ff] border border-[#1b2a4a]' : 'bg-blue-500 text-white'
                }`}>AI</div>
              )}
              <div className={`rounded-lg p-3 max-w-[75%] ${message.role === "user" ? (
                isDarkTheme ? 'bg-[#8b5cf6] text-white' : 'bg-blue-500 text-white'
              ) : (
                isDarkTheme ? 'bg-[#0f1b2d] text-[#e7ecf5]' : 'bg-gray-100 text-gray-900'
              )}`}>
                {message.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={message.image} alt="user upload" className="rounded-md mb-2 max-w-full h-auto" />
                )}
                {message.document && (
                  <div className={`p-2 rounded-md mb-2 ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <FileTextIcon className={`w-5 h-5 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}/>
                      <p className={`text-sm font-medium truncate ${isDarkTheme ? 'text-gray-200' : 'text-gray-800'}`}>{message.document.name}</p>
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
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${isDarkTheme ? 'bg-[#0f1b2d] text-[#a8c1ff] border border-[#1b2a4a]' : 'bg-blue-500 text-white'}`}>AI</div>
                <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-[#0f1b2d]' : 'bg-gray-100'}`}>
                  <div className="flex space-x-1">
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkTheme ? 'bg-gray-400' : 'bg-gray-500'}`}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkTheme ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '0.1s' }}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkTheme ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className={`p-3 md:p-4 border-t ${isDarkTheme ? 'border-[#1b2a4a] bg-[#0b1220]' : 'border-gray-200 bg-white'}`}>
          {/* Image Preview */}
          {image && (
            <div className="mb-3 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <img 
                  src={image} 
                  alt="Preview" 
                  className="w-12 h-12 object-cover rounded border"
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
                    Image selected
                  </p>
                  <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    Ready to send
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setImage(null)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Document Preview */}
          {document && (
            <div className="mb-3 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <FileTextIcon className={`w-8 h-8 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
                    {document.name}
                  </p>
                  <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    PDF document ready to send
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setDocument(null)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Health Report Preview */}
          {healthReport && (
            <div className="mb-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  healthReport.riskLevel === 'critical' ? 'bg-red-500' :
                  healthReport.riskLevel === 'high' ? 'bg-orange-500' :
                  healthReport.riskLevel === 'moderate' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}>
                  <FileTextIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
                      {healthReport.title}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      healthReport.riskLevel === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      healthReport.riskLevel === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      healthReport.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {healthReport.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                    {healthReport.reportType.replace('_', ' ').toUpperCase()} • Analyzed & Ready
                  </p>
                  <p className={`text-xs ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                    {healthReport.summary}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/api/health-reports/${healthReport.id}/pdf`, '_blank')}
                      className={`text-xs h-7 ${isDarkTheme ? '' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <DownloadIcon className={`w-3 h-3 mr-1 ${isDarkTheme ? '' : 'text-gray-700'}`} />
                      PDF
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open('/health-history', '_blank')}
                      className={`text-xs h-7 ${isDarkTheme ? '' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <HistoryIcon className={`w-3 h-3 mr-1 ${isDarkTheme ? '' : 'text-gray-700'}`} />
                      History
                    </Button>
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setHealthReport(null)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Analysis Loading */}
          {isAnalyzing && (
            <div className="mb-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
                    Analyzing Health Report...
                  </p>
                  <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    AI is processing your health report
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
            <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isAtLimit}>
              <PaperclipIcon className={`w-5 h-5 ${isDarkTheme ? 'text-[#d6e4ff]' : 'text-black'}`} />
            </Button>
            <Input
              className={`flex-1 ${isDarkTheme ? 'bg-[#0f1b2d] text-[#d6e4ff] placeholder-[#7d8aa6] border-[#1b2a4a]' : 'bg-gray-100 text-black placeholder-gray-500 border-gray-300'}`}
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
              className={`${isDarkTheme ? 'bg-[#8b5cf6] hover:bg-[#7c4fe0]' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-full ${isDarkTheme ? 'w-10 h-10 p-0' : ''}`}
            >
              <SendIcon className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center justify-center pt-2">
            <LockIcon className={`w-3 h-3 mr-1.5 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>HIPAA-Private chat</p>
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

function XIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function HistoryIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}