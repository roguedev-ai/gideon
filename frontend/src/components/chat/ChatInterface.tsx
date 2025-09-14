import React, { useState, useEffect } from 'react';
import { Send, Settings, MessageSquare, User, Key } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import APIKeyManager from '../settings/APIKeyManager';
import AddAPIKeyForm from '../settings/AddAPIKeyForm';

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

interface ApiKey {
  id: number;
  provider: string;
  name: string;
  user_id: number;
  is_active: boolean;
  created_at: string;
}

const ChatInterface: React.FC = () => {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | undefined>(undefined);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<number | undefined>(undefined);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddAPIKeyForm, setShowAddAPIKeyForm] = useState(false);

  // Load real conversations and user API keys from backend
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Load conversations
        const realConversations = await import('../../services/api').then(m => m.apiService).then(api => api.getConversations());
        setConversations(realConversations);

        // Load user's API keys
        const keys = await import('../../services/api').then(m => m.apiService).then(api => api.getAPIKeys());
        setApiKeys(keys);
        // Auto-select first active API key if user has one
        if (keys.length > 0 && !selectedApiKeyId) {
          const firstActiveKey = keys.find(key => key.is_active);
          if (firstActiveKey) {
            setSelectedApiKeyId(firstActiveKey.id);
          }
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Fallback to empty states
        setConversations([]);
        setApiKeys([]);
      }
    };

    loadData();
  }, [user, selectedApiKeyId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedApiKeyId) return;

    setIsLoading(true);

    // Add user message immediately to UI
    const userMessage: Message = {
      id: Date.now(),
      content: message,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = message; // Store before clearing
    setMessage('');

    try {
      // Send message to backend
      const chatRequest = {
        message: messageText,
        conversation_id: activeConversationId,
        api_key_id: selectedApiKeyId,
        model: 'gpt-3.5-turbo', // Default model - can be made configurable later
      };

      const response = await import('../../services/api').then(m => m.apiService).then(api => api.sendChatMessage(chatRequest));

      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now(),
        content: response.message.content,
        role: 'assistant',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update conversation ID if this was the first message
      if (response.conversation_id && !activeConversationId) {
        setActiveConversationId(response.conversation_id);

        // Refresh conversations list to include the new one
        const updatedConversations = await import('../../services/api').then(m => m.apiService).then(api => api.getConversations());
        setConversations(updatedConversations);
      }

    } catch (error) {
      console.error('Failed to send message:', error);

      // Add error message
      const errorMessage: Message = {
        id: Date.now(),
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to send message. Please try again.'}`,
        role: 'assistant',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(undefined);
    setMessages([]);
    setMessage('');
  };

  const selectConversation = async (conversation: Conversation) => {
    setActiveConversationId(conversation.id);

    try {
      const realMessages = await import('../../services/api').then(m => m.apiService).then(api => api.getConversationMessages(conversation.id));
      setMessages(realMessages);
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      // Fallback to empty state
      setMessages([]);
    }
  };

  const renameConversation = async (conversationId: number, newTitle: string) => {
    try {
      await import('../../services/api').then(m => m.apiService).then(api =>
        api.updateConversation(conversationId, { title: newTitle })
      );
      // Update local state
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId ? { ...conv, title: newTitle } : conv
      ));
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      alert('Failed to rename conversation');
    }
  };

  const deleteConversation = async (conversationId: number) => {
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) { // eslint-disable-line no-restricted-globals
      return;
    }

    try {
      await import('../../services/api').then(m => m.apiService).then(api => api.deleteConversation(conversationId));
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));

      // If we deleted the active conversation, clear it
      if (activeConversationId === conversationId) {
        setActiveConversationId(undefined);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation');
    }
  };

  const exportConversation = (conversation: Conversation) => {
    const exportData = {
      title: conversation.title,
      messages: messages,
      exportedAt: new Date().toISOString(),
      totalMessages: conversation.message_count
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings size={18} />
              <span className="text-sm">Settings</span>
            </button>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        size="2xl"
      >
        {showAddAPIKeyForm ? (
          <AddAPIKeyForm
            onClose={() => setShowAddAPIKeyForm(false)}
            onSuccess={() => {
              setShowAddAPIKeyForm(false);
              // Refresh API keys
              import('../../services/api').then(m => m.apiService).then(api => api.getAPIKeys()).then(setApiKeys);
            }}
          />
        ) : (
          <APIKeyManager
            selectedApiKeyId={selectedApiKeyId}
            onApiKeySelect={setSelectedApiKeyId}
            onClose={() => setShowSettingsModal(false)}
          />
        )}
      </Modal>
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
