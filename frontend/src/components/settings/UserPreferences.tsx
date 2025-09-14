import React, { useState, useEffect } from 'react';
import { Palette, Moon, Sun, Save, Cpu, MessageSquare, Globe, Volume2, VolumeX } from 'lucide-react';
import * as apiService from '../../services/api';

interface UserPreferencesData {
  theme: 'light' | 'dark' | 'auto';
  default_model: string;
  chat_settings: {
    auto_save: boolean;
    show_typing_indicator: boolean;
    message_history_limit: number;
    enable_sound_notifications: boolean;
  };
  ui_settings: {
    message_bubble_style: 'default' | 'minimal' | 'compact';
    show_timestamps: boolean;
    conversation_list_view: 'list' | 'grid';
    sidebar_collapsed?: boolean;
  };
}

interface UserPreferencesProps {
  onSave?: (preferences: UserPreferencesData) => void;
  onClose?: () => void;
}

const UserPreferences: React.FC<UserPreferencesProps> = ({ onSave, onClose }) => {
  const [preferences, setPreferences] = useState<UserPreferencesData>({
    theme: 'light',
    default_model: 'gpt-3.5-turbo',
    chat_settings: {
      auto_save: true,
      show_typing_indicator: true,
      message_history_limit: 1000,
      enable_sound_notifications: false,
    },
    ui_settings: {
      message_bubble_style: 'default',
      show_timestamps: true,
      conversation_list_view: 'list',
    },
  });
  const [availableModels, setAvailableModels] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current preferences and available models
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current user preferences
        const userPrefs = await apiService.apiService.getUserPreferences();
        if (userPrefs) {
          setPreferences({
            ...preferences,
            ...(userPrefs as any), // Merge with API data
          });
        }

        // Load available AI models
        const models = await apiService.apiService.getAvailableModels();
        setAvailableModels(models);
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.apiService.updateUserPreferences(preferences);
      onSave?.(preferences);

      // Apply theme immediately
      applyTheme(preferences.theme);

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
    } else if (theme === 'auto') {
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const updatePreference = (section: keyof UserPreferencesData, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [key]: value
      }
    }));
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
                  onClick={() => setPreferences(prev => ({ ...prev, theme: 'auto' }))}
                  className={`flex items-center justify-center p-4 border rounded-lg transition-colors ${
                    preferences.theme === 'auto'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Globe className="h-5 w-5 mr-2" />
                  <span className="text-sm">Auto</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Message Bubble Style
              </label>
              <select
                value={preferences.ui_settings.message_bubble_style}
                onChange={(e) => updatePreference('ui_settings', 'message_bubble_style', e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="default">Default</option>
                <option value="minimal">Minimal</option>
                <option value="compact">Compact</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="show_timestamps"
                type="checkbox"
                checked={preferences.ui_settings.show_timestamps}
                onChange={(e) => updatePreference('ui_settings', 'show_timestamps', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="show_timestamps" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show message timestamps
              </label>
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
                {/* OpenAI Models */}
                {availableModels.openai?.map((model) => (
                  <option key={`openai-${model}`} value={model}>
                    OpenAI: {model}
                  </option>
                ))}

                {/* Anthropic Models */}
                {availableModels.anthropic?.map((model) => (
                  <option key={`anthropic-${model}`} value={model}>
                    Anthropic: {model}
                  </option>
                ))}

                <option value="gpt-3.5-turbo" selected={!availableModels.openai?.includes(preferences.default_model) && !availableModels.anthropic?.includes(preferences.default_model)}>
                  gpt-3.5-turbo (Default)
                </option>
              </select>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This model will be used for new conversations unless overridden
              </p>
            </div>
          </div>
        </div>

        {/* Chat Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Chat Settings
          </h3>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="auto_save"
                type="checkbox"
                checked={preferences.chat_settings.auto_save}
                onChange={(e) => updatePreference('chat_settings', 'auto_save', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="auto_save" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Auto-save conversations
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="show_typing"
                type="checkbox"
                checked={preferences.chat_settings.show_typing_indicator}
                onChange={(e) => updatePreference('chat_settings', 'show_typing_indicator', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="show_typing" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show typing indicator when AI is responding
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="sound_notifications"
                type="checkbox"
                checked={preferences.chat_settings.enable_sound_notifications}
                onChange={(e) => updatePreference('chat_settings', 'enable_sound_notifications', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="sound_notifications" className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                {preferences.chat_settings.enable_sound_notifications ? (
                  <Volume2 className="mr-1 h-4 w-4" />
                ) : (
                  <VolumeX className="mr-1 h-4 w-4" />
                )}
                Enable sound notifications for new messages
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Maximum Messages Per Conversation
              </label>
              <select
                value={preferences.chat_settings.message_history_limit}
                onChange={(e) => updatePreference('chat_settings', 'message_history_limit', parseInt(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="50">50 messages</option>
                <option value="100">100 messages</option>
                <option value="500">500 messages</option>
                <option value="1000">1000 messages (Recommended)</option>
                <option value="2000">2000 messages</option>
              </select>
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

export default UserPreferences;
