import type { Message, ChatState, ToolCall, SessionInfo } from '../../worker/types';
export interface ChatResponse {
  success: boolean;
  data?: ChatState;
  error?: string;
}
export const MODELS = [
  { id: 'google-ai-studio/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'google-ai-studio/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'google-ai-studio/gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
];
class ChatService {
  private sessionId: string;
  private baseUrl: string;
  constructor() {
    const saved = localStorage.getItem('veridia_session_id');
    this.sessionId = saved || crypto.randomUUID();
    if (!saved) localStorage.setItem('veridia_session_id', this.sessionId);
    this.baseUrl = `/api/chat/${this.sessionId}`;
  }
  private ensureBaseUrl() {
    if (!this.sessionId) {
      const saved = localStorage.getItem('veridia_session_id');
      this.sessionId = saved || crypto.randomUUID();
      localStorage.setItem('veridia_session_id', this.sessionId);
    }
    this.baseUrl = `/api/chat/${this.sessionId}`;
  }
  async validateSession(): Promise<boolean> {
    try {
      const res = await fetch('/api/health');
      return res.ok;
    } catch {
      return false;
    }
  }
  async sendMessage(
    message: string,
    model?: string,
    onChunk?: (chunk: string) => void
  ): Promise<ChatResponse> {
    this.ensureBaseUrl();
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model, stream: !!onChunk }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (chunk) onChunk(chunk);
          }
        } finally {
          reader.releaseLock();
        }
        return { success: true };
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }
      return await response.json();
    } catch (error: any) {
      console.error('Failed to send message:', error?.message || String(error));
      return { success: false, error: error?.message || 'Service unavailable' };
    }
  }
  async getMessages(): Promise<ChatResponse> {
    this.ensureBaseUrl();
    try {
      const response = await fetch(`${this.baseUrl}/messages`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Expected JSON response but received different format');
      }
      return await response.json();
    } catch (error: any) {
      console.error('Failed to get messages:', error?.message || String(error));
      return { success: false, error: error?.message || 'Failed to load history' };
    }
  }
  async clearMessages(): Promise<ChatResponse> {
    this.ensureBaseUrl();
    try {
      const response = await fetch(`${this.baseUrl}/clear`, { method: 'DELETE' });
      return await response.json();
    } catch (error: any) {
      console.error('Failed to clear messages:', error?.message || String(error));
      return { success: false, error: 'Failed to clear session' };
    }
  }
  getSessionId(): string {
    return this.sessionId;
  }
  newSession(): void {
    this.sessionId = crypto.randomUUID();
    localStorage.setItem('veridia_session_id', this.sessionId);
    this.baseUrl = `/api/chat/${this.sessionId}`;
  }
  switchSession(sessionId: string): void {
    this.sessionId = sessionId;
    localStorage.setItem('veridia_session_id', this.sessionId);
    this.baseUrl = `/api/chat/${sessionId}`;
  }
  async createSession(title?: string, sessionId?: string, firstMessage?: string) {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sessionId, firstMessage })
      });
      return await response.json();
    } catch (error: any) {
      console.error('Failed to create session:', error?.message || String(error));
      return { success: false, error: 'Session creation failed' };
    }
  }
  async listSessions(): Promise<{ success: boolean; data?: SessionInfo[]; error?: string }> {
    try {
      const response = await fetch('/api/sessions');
      return await response.json();
    } catch (error: any) {
      console.error('Failed to list sessions:', error?.message || String(error));
      return { success: false, error: 'List sessions failed' };
    }
  }
  async deleteSession(sessionId: string) {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      return await response.json();
    } catch (error: any) {
      console.error('Failed to delete session:', error?.message || String(error));
      return { success: false };
    }
  }
  async updateModel(model: string): Promise<ChatResponse> {
    this.ensureBaseUrl();
    try {
      const response = await fetch(`${this.baseUrl}/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      return await response.json();
    } catch (error: any) {
      console.error('Failed to update model:', error?.message || String(error));
      return { success: false, error: 'Model switch failed' };
    }
  }
}
export const chatService = new ChatService();
export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
export const generateSessionTitle = (firstUserMessage?: string): string => {
  const now = new Date();
  const dateTime = now.toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  if (!firstUserMessage?.trim()) return `Consultation ${dateTime}`;
  const truncated = firstUserMessage.trim().replace(/\s+/g, ' ').slice(0, 37);
  return `${truncated}${firstUserMessage.length > 37 ? '...' : ''} • ${dateTime}`;
};
export const renderToolCall = (toolCall: ToolCall): string => {
  const result = toolCall.result as any;
  if (!result) return `Task: ${toolCall.name}`;
  if (result.error) return `Error in ${toolCall.name}`;
  return `${toolCall.name} completed`;
};