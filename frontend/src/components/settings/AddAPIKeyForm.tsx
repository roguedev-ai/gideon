import React, { useState } from 'react';
import { Key, Save, X, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import * as apiService from '../../services/api';

interface AddAPIKeyFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddAPIKeyForm: React.FC<AddAPIKeyFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    provider: '',
    name: '',
    apiKey: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  const providers = [
    { id: 'openai', name: 'OpenAI', description: 'GPT models (GPT-4, GPT-3.5)', color: 'bg-green-100 text-green-800' },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude models', color: 'bg-orange-100 text-orange-800' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation result when user starts typing
    if (name === 'apiKey') {
      setValidationResult({});
    }
  };

  const validateApiKey = async () => {
    if (!formData.apiKey.trim()) {
      setValidationResult({ success: false, message: 'Please enter an API key' });
      return;
    }

    setIsValidating(true);
    setValidationResult({});

    try {
      // Try to get available models to validate the key
      const models = await apiService.apiService.getAvailableModels();

      if (formData.provider === 'openai' && models.openai) {
        setValidationResult({ success: true, message: '✅ OpenAI API key is valid!' });
      } else if (formData.provider === 'anthropic' && models.anthropic) {
        setValidationResult({ success: true, message: '✅ Anthropic API key is valid!' });
      } else {
        setValidationResult({ success: false, message: '❌ API key validation failed' });
      }
    } catch (error) {
      console.error('API key validation error:', error);
      setValidationResult({
        success: false,
        message: '❌ API key is invalid or there was an error validating it'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.provider || !formData.name.trim() || !formData.apiKey.trim()) {
      setValidationResult({ success: false, message: 'Please fill in all fields' });
      return;
    }

    // Validate API key first
    if (!validationResult.success) {
      await validateApiKey();
      if (!validationResult.success) return;
    }

    setIsSubmitting(true);

    try {
      const newApiKey = await apiService.apiService.createAPIKey({
        provider: formData.provider,
        name: formData.name.trim(),
        api_key: formData.apiKey.trim()
      });

      // Success!
      setValidationResult({
        success: true,
        message: `✅ API key "${formData.name}" added successfully!`
      });

      // Close form after brief delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Failed to add API key:', error);
      setValidationResult({
        success: false,
        message: '❌ Failed to add API key. Please check your API key and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.provider && formData.name.trim() && formData.apiKey.trim();

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Key className="mr-3 h-6 w-6 text-primary-600" />
            Add New API Key
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect your OpenAI or Anthropic API key to start chatting
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            AI Provider
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <label
                key={provider.id}
                className={`relative flex cursor-pointer rounded-lg border bg-white dark:bg-gray-700 p-4 shadow-sm focus:outline-none ${
                  formData.provider === provider.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={provider.id}
                  checked={formData.provider === provider.id}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <span className={`font-medium ${formData.provider === provider.id ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100'}`}>
                      {provider.name}
                    </span>
                    <span className={`text-sm mt-1 ${formData.provider === provider.id ? 'text-primary-700 dark:text-primary-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {provider.description}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs w-fit mt-2 ${provider.color}`}>
                      {provider.name}
                    </span>
                  </span>
                </span>
                {formData.provider === provider.id && (
                  <span className="absolute top-4 right-4 h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Key Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Key Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Personal OpenAI Key"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            required
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            A descriptive name to help you identify this API key
          </p>
        </div>

        {/* API Key Input */}
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Key <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              id="apiKey"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleInputChange}
              placeholder={formData.provider === 'openai' ? 'sk-...' : formData.provider === 'anthropic' ? 'sk-ant-...' : 'Your API key'}
              className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your API key will be securely encrypted and stored
            </p>
            <button
              type="button"
              onClick={validateApiKey}
              disabled={!formData.apiKey.trim() || !formData.provider || isValidating}
              className={`inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium ${
                formData.apiKey.trim() && formData.provider && !isValidating
                  ? 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Key className="mr-1.5 h-3 w-3" />
                  Validate Key
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation Result */}
        {validationResult.message && (
          <div className={`p-4 rounded-md flex items-start ${
            validationResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <AlertCircle className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
              validationResult.success ? 'text-green-400' : 'text-red-400'
            }`} />
            <p className={`text-sm ${
              validationResult.success
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {validationResult.message}
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting || !validationResult.success}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isFormValid && !isSubmitting && validationResult.success
                ? 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                : 'bg-gray-400 cursor-not-allowed'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding API Key...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Add API Key
              </>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Key className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Security & Privacy
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Your API keys are encrypted before storage</li>
                  <li>Keys are never transmitted unencrypted</li>
                  <li>You can delete keys at any time</li>
                  <li>Keys are only used for chat requests to AI providers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddAPIKeyForm;
