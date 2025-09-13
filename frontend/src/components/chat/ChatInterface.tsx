import React, { useState, useEffect } from 'react';
import { Send, Settings, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  message_count: number;
}

interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

const ChatInterface: React.FC = () => {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  // Mock data for demo
  useEffect(() => {
    // Simulate loading conversations
    const mockConversations: Conversation[] = [
      { id: 1, title: 'Getting Started', created_at: new Date().toISOString(), message_count: 3 },
      { id: 2, title: 'Project Ideas', created_at: new Date().toISOString(), message_count: 5 },
    ];
    setConversations(mockConversations);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      content: message,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now() + 1,
        content: "Hello! This is a preview of Gideon's AI chat functionality. The full chat interface is coming in Phase 2. In the meantime, you can test the backend API directly.",
        role: 'assistant',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setMessage('');
  };

  const selectConversation = (conversation: Conversation) => {
    setActiveConversationId(conversation.id);
    // In a real implementation, this would load the conversation messages
    setMessages([
      { id: 1, content: "Hi there! This is a mock conversation for demo purposes.", role: 'assistant', created_at: new Date().toISOString() },
      { id: 2, content: "Currently building the full chat interface!", role: 'user', created_at: new Date().toISOString() },
      { id: 3, content: "Stay tuned for real-time AI conversations with MCP server integration coming soon!", role: 'assistant', created_at: new Date().toISOString() },
    ]);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Gideon
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleNewConversation}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="New Conversation"
              >
                <MessageSquare size={18} />
              </button>
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                <User size={16} />
                <span>{user?.username}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Conversations
            </div>
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeConversationId === conv.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium truncate">
                    {conv.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {conv.message_count} messages
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings size={18} />
              <span className="text-sm">Settings</span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Welcome to Gideon AI Chat
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start a conversation by typing a message below
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  Backend: ✅ Complete | Frontend: 🔄 Building...
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`message-bubble ${
                    msg.role === 'user'
                      ? 'message-user'
                      : 'message-assistant'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="message-bubble message-assistant">
                <LoadingSpinner size="sm" message="AI is thinking..." />
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="chat-input"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="text-white" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Gideon AI Chat MCP Studio - Backend Ready, Frontend Building...
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
