import type { Message, ChatState, ToolCall, SessionInfo } from '../../worker/types';
export interface ChatResponse {
  success: boolean;
  data?: ChatState;
  error?: string;
  detail?: string;
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
    if (!this.sessionId || this.sessionId.length < 8) {
      const saved = localStorage.getItem('veridia_session_id');
      this.sessionId = saved && saved.length >= 8 ? saved : crypto.randomUUID();
      localStorage.setItem('veridia_session_id', this.sessionId);
    }
    this.baseUrl = `/api/chat/${this.sessionId}`;
  }
  async validateSession(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('/api/health', { signal: controller.signal });
      clearTimeout(timeoutId);
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
        return { 
          success: false, 
          error: errorData.error || `Intelligence system returned ${response.status}`,
          detail: errorData.detail
        };
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
        throw new Error('Unexpected non-JSON response from intelligence core');
      }
      return await response.json();
    } catch (error: any) {
      console.error('Network failure in sendMessage:', error?.message || String(error));
      return { success: false, error: 'Veridia gateway timed out' };
    }
  }
  async getMessages(): Promise<ChatResponse> {
    this.ensureBaseUrl();
    try {
      const response = await fetch(`${this.baseUrl}/messages`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.error || 'Identity retrieval failed',
          detail: errorData.detail
        };
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Retrieved identity context in invalid format');
      }
      return await response.json();
    } catch (error: any) {
      console.error('Network failure in getMessages:', error?.message || String(error));
      return { success: false, error: 'Vault synchronization failed' };
    }
  }
  async clearMessages(): Promise<ChatResponse> {
    this.ensureBaseUrl();
    try {
      const response = await fetch(`${this.baseUrl}/clear`, { method: 'DELETE' });
      return await response.json();
    } catch (error: any) {
      console.error('Network failure in clearMessages:', error?.message || String(error));
      return { success: false, error: 'Vault purge operation failed' };
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
    if (!sessionId || sessionId.length < 8) return;
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
      console.error('Session creation network error:', error?.message || String(error));
      return { success: false, error: 'Session allocation failed' };
    }
  }
  async listSessions(): Promise<{ success: boolean; data?: SessionInfo[]; error?: string }> {
    try {
      const response = await fetch('/api/sessions');
      return await response.json();
    } catch (error: any) {
      return { success: false, error: 'Vault history unreachable' };
    }
  }
  async deleteSession(sessionId: string) {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      return await response.json();
    } catch (error: any) {
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
      return { success: false, error: 'Intelligence model switch failed' };
    }
  }
}
export const chatService = new ChatService();
export const formatTime = (timestamp: number): string => {
  if (!timestamp) return '--:--';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
export const generateSessionTitle = (firstUserMessage?: string): string => {
  const now = new Date();
  const dateTime = now.toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  if (!firstUserMessage?.trim()) return `Consult ${dateTime}`;
  const truncated = firstUserMessage.trim().replace(/\s+/g, ' ').slice(0, 37);
  return `${truncated}${firstUserMessage.length > 37 ? '...' : ''} • ${dateTime}`;
};
export const renderToolCall = (toolCall: ToolCall): string => {
  const result = toolCall.result as any;
  if (!result) return `Task: ${toolCall.name}`;
  if (result.error) return `Failure: ${toolCall.name}`;
  return `${toolCall.name} complete`;
};