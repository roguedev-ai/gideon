// API Types - matching backend Pydantic models

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'custom';
  custom_theme?: Record<string, string>;
  logo_url?: string;
  background_image_url?: string;
  default_model: string;
  auto_save: boolean;
  vector_search_enabled: boolean;
  mcp_tools_enabled: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  model?: string;
  tokens_used?: number;
  tool_calls?: any;
  vector_ids?: string[];
}

export interface ChatRequest {
  message: string;
  conversation_id?: number;
  api_key_id: number;
  model?: string;
  use_vector_search?: boolean;
  mcp_tools_enabled?: boolean;
}

export interface ChatResponse {
  message: Message;
  conversation_id: number;
  tool_calls_used?: any[];
}

export interface APIKey {
  id: number;
  provider: string;
  name: string;
  user_id: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateAPIKeyRequest {
  provider: string;
  name: string;
  api_key: string;
}

export interface MCPServer {
  id: number;
  user_id: number;
  name: string;
  url: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  last_connected?: string;
  connection_errors: number;
  connection_type?: string;
}

export interface CreateMCPServerRequest {
  name: string;
  url: string;
  description?: string;
  connection_type?: string;
  configuration?: Record<string, any>;
}

// UI State Types
export interface ChatUIState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface APIKeysState {
  keys: APIKey[];
  isLoading: boolean;
}

export interface MCPServersState {
  servers: MCPServer[];
  isLoading: boolean;
}
