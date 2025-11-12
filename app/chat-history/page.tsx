"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  hasImage?: boolean;
  document?: { name: string };
  healthReport?: {
    id: string;
    title: string;
    reportType: string;
  };
}

interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export default function ChatHistoryPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchConversations();
    }
  }, [session]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat-conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch chat conversations:', response.status, errorData);
        toast.error(`Failed to fetch chat conversations: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching chat conversations:', error);
      toast.error(`Error fetching chat conversations: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.messages.some(msg => 
                           msg.content.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    return matchesSearch;
  });

  const deleteConversation = async (conversationId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    const toastId = toast.loading('Deleting conversation...');
    setDeletingId(conversationId);
    try {
      const response = await fetch(`/api/chat-conversations/${conversationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        toast.success('Conversation deleted successfully', { id: toastId });
        if (expandedId === conversationId) {
          setExpandedId(null);
        }
      } else {
        toast.error('Failed to delete conversation', { id: toastId });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Error deleting conversation', { id: toastId });
    } finally {
      setDeletingId(null);
      toast.dismiss(toastId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  const getPreviewText = (messages: ChatMessage[]) => {
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage?.content) {
      const content = firstUserMessage.content.substring(0, 150);
      return content + (firstUserMessage.content.length > 150 ? '...' : '');
    }
    return 'No preview available';
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please Sign In</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You need to be signed in to view your chat history.</p>
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chat History</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                View and manage your past conversations
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/health-history">
                <Button variant="outline">Health History</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Conversations
          </label>
          <Input
            type="text"
            placeholder="Search by title or message content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Conversations List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading chat conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Chat Conversations Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {conversations.length === 0 
                  ? "You haven't had any conversations yet. Start chatting in the dashboard to see your conversations here."
                  : "No conversations match your search. Try adjusting your search terms."
                }
              </p>
              {conversations.length === 0 && (
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredConversations.map((conversation) => (
                <div key={conversation.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {conversation.title}
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {conversation.messages.length} {conversation.messages.length === 1 ? 'message' : 'messages'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {formatDate(conversation.updated_at)}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                        {getPreviewText(conversation.messages)}
                      </p>
                      
                      {expandedId === conversation.id && (
                        <div className="mt-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                          {conversation.messages.map((message, index) => (
                            <div
                              key={message.id || index}
                              className={`p-4 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-blue-50 dark:bg-blue-900/20 ml-8'
                                  : 'bg-gray-50 dark:bg-gray-700/50 mr-8'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-semibold ${
                                  message.role === 'user'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {message.role === 'user' ? 'You' : 'Assistant'}
                                </span>
                                {message.hasImage && (
                                  <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                    📷 Image
                                  </span>
                                )}
                                {message.document && (
                                  <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    📄 {message.document.name}
                                  </span>
                                )}
                                {message.healthReport && (
                                  <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                    📋 {message.healthReport.title}
                                  </span>
                                )}
                              </div>
                              <div className={`prose prose-sm max-w-none ${
                                message.role === 'user'
                                  ? 'text-gray-900 dark:text-gray-100'
                                  : 'text-gray-800 dark:text-gray-200'
                              }`}>
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedId(expandedId === conversation.id ? null : conversation.id)}
                        className="w-full"
                      >
                        {expandedId === conversation.id ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            Collapse
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            View
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteConversation(conversation.id, conversation.title)}
                        className="w-full flex items-center justify-center"
                        disabled={deletingId === conversation.id}
                      >
                        {deletingId === conversation.id ? (
                          <>
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {conversations.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{conversations.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Conversations</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-blue-600">
                {conversations.reduce((sum, conv) => sum + conv.messages.length, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Messages</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-green-600">
                {conversations.filter(conv => {
                  const today = new Date();
                  const convDate = new Date(conv.updated_at);
                  return convDate.toDateString() === today.toDateString();
                }).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Today</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

