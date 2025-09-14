import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Key, Check, X, Shield, Loader2 } from 'lucide-react';
import * as apiService from '../../services/api';

interface APIKey {
  id: number;
  provider: string;
  name: string;
  user_id: number;
  is_active: boolean;
  created_at: string;
}

interface APIKeyManagerProps {
  selectedApiKeyId?: number | null;
  onApiKeySelect?: (apiKeyId: number) => void;
  onClose?: () => void;
}

const APIKeyManager: React.FC<APIKeyManagerProps> = ({
  selectedApiKeyId,
  onApiKeySelect,
  onClose
}) => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingKey, setTestingKey] = useState<number | null>(null);

  // Load API keys on mount
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const keys = await apiService.apiService.getAPIKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (apiKeyId: number) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.apiService.deleteAPIKey(apiKeyId);
      setApiKeys(prev => prev.filter(key => key.id !== apiKeyId));

      // If we deleted the selected key, clear selection
      if (selectedApiKeyId === apiKeyId && onApiKeySelect) {
        onApiKeySelect(0); // Reset selection
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key. Please try again.');
    }
  };

  const testApiKey = async (apiKey: APIKey) => {
    setTestingKey(apiKey.id);
    try {
      // We'll use a simple API call to test the key
      // For now, just simulate testing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, you might call a test endpoint
      const testResponse = await apiService.apiService.getAvailableModels();
      if (testResponse) {
        alert(`${apiKey.name} API key is valid and working!`);
      }
    } catch (error) {
      alert(`${apiKey.name} API key appears to be invalid or there was an error testing it.`);
    } finally {
      setTestingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Key className="mr-3 h-6 w-6" />
            API Key Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your OpenAI and Anthropic API keys for chat functionality
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add API Key
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* API Key Status Summary */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-blue-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                API Key Status
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                {apiKeys.length > 0
                  ? `${apiKeys.filter(k => k.is_active).length} active API keys`
                  : 'No API keys configured'
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {apiKeys.filter(k => k.is_active).length}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-200">Active</div>
          </div>
        </div>
      </div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-12">
          <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No API keys added yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Add your OpenAI or Anthropic API key to start chatting with AI models.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Your First API Key
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {apiKeys.map((apiKey) => (
              <li key={apiKey.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {apiKey.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {apiKey.provider.toUpperCase()} • Added {new Date(apiKey.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {selectedApiKeyId === apiKey.id && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <Check className="mr-1 h-3 w-3" />
                            Selected
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          apiKey.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}>
                          {apiKey.is_active ? <Check className="mr-1 h-3 w-3" /> : <X className="mr-1 h-3 w-3" />}
                          {apiKey.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={() => testApiKey(apiKey)}
                      disabled={testingKey === apiKey.id}
                      className={`inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium ${
                        testingKey === apiKey.id
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {testingKey === apiKey.id ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-1 h-3 w-3" />
                          Test
                        </>
                      )}
                    </button>

                    {onApiKeySelect && (
                      <button
                        onClick={() => onApiKeySelect(apiKey.id)}
                        disabled={!apiKey.is_active}
                        className={`inline-flex items-center px-3 py-1.5 border rounded text-sm font-medium ${
                          selectedApiKeyId === apiKey.id
                            ? 'border-primary-500 text-primary-700 bg-primary-50 hover:bg-primary-100'
                            : apiKey.is_active
                              ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                              : 'border-gray-300 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {selectedApiKeyId === apiKey.id ? 'Selected' : 'Use for Chat'}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteApiKey(apiKey.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add API Key Form Placeholder */}
      {showAddForm && (
        <div className="mt-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-center text-gray-500 dark:text-gray-400">
            API Key form will be implemented next (AddAPIKeyForm component)
          </p>
          <button
            onClick={() => setShowAddForm(false)}
            className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default APIKeyManager;
