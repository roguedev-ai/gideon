import React, { useState, useEffect } from 'react';
import { Palette, Moon, Sun, Save, Cpu, MessageSquare, Globe, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { UserPreferences } from '../../types/api';

interface UserPreferencesProps {
  onSave?: (preferences: UserPreferences) => void;
  onClose?: () => void;
}

const UserPreferencesComponent: React.FC<UserPreferencesProps> = ({ onSave, onClose }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    default_model: 'gpt-3.5-turbo',
    auto_save: true,
    vector_search_enabled: false,
    mcp_tools_enabled: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current preferences
  useEffect(() => {
    const loadData = async () => {
      try {
        // For now, use default preferences
        // In a real implementation, you would call an API to get user preferences
        setLoading(false);
      } catch (error) {
        console.error('Failed to load user preferences:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // For now, just simulate saving
      // In a real implementation, you would call an API to save user preferences
      await new Promise(resolve => setTimeout(resolve, 1000));

      onSave?.(preferences);
      // Show success feedback
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading preferences...</p>
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
            <Palette className="mr-3 h-6 w-6" />
            User Preferences
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize your chat experience and application behavior
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
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

      {/* Preferences Sections */}
      <div className="space-y-8">
        {/* Theme Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Palette className="mr-2 h-5 w-5" />
            Appearance
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, theme: 'light' }))}
                  className={`flex items-center justify-center p-4 border rounded-lg transition-colors ${
                    preferences.theme === 'light'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Sun className="h-5 w-5 mr-2" />
                  <span className="text-sm">Light</span>
                </button>

                <button
                  onClick={() => setPreferences(prev => ({ ...prev, theme: 'dark' }))}
                  className={`flex items-center justify-center p-4 border rounded-lg transition-colors ${
                    preferences.theme === 'dark'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Moon className="h-5 w-5 mr-2" />
                  <span className="text-sm">Dark</span>
                </button>

                <button
                  onClick={() => setPreferences(prev => ({ ...prev, theme: 'custom' }))}
                  className={`flex items-center justify-center p-4 border rounded-lg transition-colors ${
                    preferences.theme === 'custom'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Globe className="h-5 w-5 mr-2" />
                  <span className="text-sm">Custom</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Model Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Cpu className="mr-2 h-5 w-5" />
            AI Model Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Default AI Model
              </label>
              <select
                value={preferences.default_model}
                onChange={(e) => setPreferences(prev => ({ ...prev, default_model: e.target.value }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
              </select>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This model will be used for new conversations unless overridden
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Advanced Settings
          </h3>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="auto_save"
                type="checkbox"
                checked={preferences.auto_save}
                onChange={(e) => setPreferences(prev => ({ ...prev, auto_save: !prev.auto_save }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="auto_save" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Auto-save conversations
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="vector_search"
                type="checkbox"
                checked={preferences.vector_search_enabled}
                onChange={(e) => setPreferences(prev => ({ ...prev, vector_search_enabled: !prev.vector_search_enabled }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="vector_search" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable vector search for improved context
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="mcp_tools"
                type="checkbox"
                checked={preferences.mcp_tools_enabled}
                onChange={(e) => setPreferences(prev => ({ ...prev, mcp_tools_enabled: !prev.mcp_tools_enabled }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="mcp_tools" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable MCP server tools for enhanced functionality
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Reminder */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Save className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Don't forget to save!
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>Your preferences are saved locally until you click "Save Preferences". Changes will be applied immediately after saving.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferencesComponent;
