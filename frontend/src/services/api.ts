import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as types from '../types/api';

// API Base URL - defaults to backend proxy
// API Base URL - fixed for production with /api prefix
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired - clear storage and redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials: types.LoginRequest): Promise<types.TokenResponse> {
    const response = await this.axiosInstance.post<types.TokenResponse>(
      '/api/auth/login/json',
      credentials
    );
    return response.data;
  }

  async register(userData: types.RegisterRequest): Promise<types.User> {
    const response = await this.axiosInstance.post<types.User>(
      '/api/auth/register',
      userData
    );
    return response.data;
  }

  async getCurrentUser(): Promise<types.User> {
    const response = await this.axiosInstance.get<types.User>('/api/users/me');
    return response.data;
  }

  // User preferences
  async getUserPreferences(): Promise<types.UserPreferences> {
    const response = await this.axiosInstance.get<types.UserPreferences>(
      '/api/users/preferences'
    );
    return response.data;
  }

  async updateUserPreferences(preferences: types.UserPreferences): Promise<types.UserPreferences> {
    const response = await this.axiosInstance.put<types.UserPreferences>(
      '/api/users/preferences',
      preferences
    );
    return response.data;
  }

  // API Keys
  async createAPIKey(apiKeyData: types.CreateAPIKeyRequest): Promise<types.APIKey> {
    const response = await this.axiosInstance.post<types.APIKey>(
      '/api/users/api-keys',
      apiKeyData
    );
    return response.data;
  }

  async getAPIKeys(): Promise<types.APIKey[]> {
    const response = await this.axiosInstance.get<types.APIKey[]>(
      '/api/users/api-keys'
    );
    return response.data;
  }

  async deleteAPIKey(apiKeyId: number): Promise<void> {
    await this.axiosInstance.delete(`/api/users/api-keys/${apiKeyId}`);
  }

  // Conversations
  async getConversations(): Promise<types.Conversation[]> {
    const response = await this.axiosInstance.get<types.Conversation[]>(
      '/api/chat/conversations'
    );
    return response.data;
  }

  async getConversation(conversationId: number): Promise<types.Conversation> {
    const response = await this.axiosInstance.get<types.Conversation>(
      `/api/chat/conversations/${conversationId}`
    );
    return response.data;
  }

  async updateConversation(
    conversationId: number,
    updates: { title?: string }
  ): Promise<types.Conversation> {
    const response = await this.axiosInstance.put<types.Conversation>(
      `/api/chat/conversations/${conversationId}`,
      updates
    );
    return response.data;
  }

  async deleteConversation(conversationId: number): Promise<void> {
    await this.axiosInstance.delete(`/api/chat/conversations/${conversationId}`);
  }

  async getConversationMessages(
    conversationId: number,
    skip: number = 0,
    limit: number = 1000
  ): Promise<types.Message[]> {
    const response = await this.axiosInstance.get<types.Message[]>(
      `/api/chat/conversations/${conversationId}/messages`,
      { params: { skip, limit } }
    );
    return response.data;
  }

  // Chat
  async sendChatMessage(chatRequest: types.ChatRequest): Promise<types.ChatResponse> {
    const response = await this.axiosInstance.post<types.ChatResponse>(
      '/api/chat/chat',
      chatRequest
    );
    return response.data;
  }

  // Streaming chat
  async sendStreamingChatMessage(
    chatRequest: types.ChatRequest,
    onMessage: (content: string) => void,
    onComplete: (fullResponse: types.ChatResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await this.axiosInstance.post(
        '/api/chat/chat/stream',
        chatRequest,
        {
          responseType: 'stream',
        }
      );

      const stream = response.data;
      let buffer = '';
      let fullContent = '';

      stream.on('data', (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        buffer += chunkStr;

        // Split by newlines - server sends SSE format
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix

            if (data === '[DONE]') {
              // Stream completed
              this.getConversations().then(conversations => {
                const latestConv = conversations[0];
                if (latestConv) {
                  onComplete({
                    message: {
                      id: Date.now(), // Temporary ID
                      conversation_id: latestConv.id,
                      role: 'assistant',
                      content: fullContent,
                      created_at: new Date().toISOString(),
                    },
                    conversation_id: latestConv.id,
                  });
                }
              });
              return;
            }

            // Add new content
            fullContent += data;
            onMessage(data);
          }
        }
      });

      stream.on('error', (error: Error) => {
        onError(error);
      });

    } catch (error) {
      onError(error as Error);
    }
  }

  // MCP Servers
  async createMCPServer(serverData: types.CreateMCPServerRequest): Promise<types.MCPServer> {
    // TODO: Implement when backend MCP endpoints are ready
    throw new Error('MCP server management not yet implemented in frontend');
  }

  async getMCPServers(): Promise<types.MCPServer[]> {
    // TODO: Implement when backend MCP endpoints are ready
    return [];
  }

  async deleteMCPServer(serverId: number): Promise<void> {
    // TODO: Implement when backend MCP endpoints are ready
    throw new Error('MCP server management not yet implemented in frontend');
  }

  // Models
  async getAvailableModels(): Promise<{ [key: string]: string[] }> {
    const response = await this.axiosInstance.get<{ [key: string]: string[] }>(
      '/api/users/models'
    );
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.axiosInstance.get<{ status: string }>('/api/health');
    return response.data;
  }
}

// Export a single instance
export const apiService = new ApiService();
export default apiService;
