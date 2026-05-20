import type { Message, ChatState, ToolCall, WeatherResult, MCPResult, ErrorResult, SessionInfo } from '../../worker/types';
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
    this.sessionId = crypto.randomUUID();
    this.baseUrl = `/api/chat/${this.sessionId}`;
  }
  async sendMessage(
    message: string,
    model?: string,
    onChunk?: (chunk: string) => void
  ): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model, stream: !!onChunk }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Chat error (HTTP ${response.status}):`, errorText);
        throw new Error(`HTTP ${response.status}`);
      }
      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (chunk) {
              onChunk(chunk);
            }
          }
        } finally {
          reader.releaseLock();
        }
        return { success: true };
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to send message:', error);
      return { success: false, error: 'Network error or service unavailable' };
    }
  }
  async getMessages(): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`);
      if (!response.ok) {
        console.error(`Failed to fetch messages: HTTP ${response.status}`);
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get messages:', error);
      return { success: false, error: 'Failed to load consultation history' };
    }
  }
  async clearMessages(): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/clear`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to clear messages:', error);
      return { success: false, error: 'Failed to clear session data' };
    }
  }
  getSessionId(): string {
    return this.sessionId;
  }
  newSession(): void {
    this.sessionId = crypto.randomUUID();
    this.baseUrl = `/api/chat/${this.sessionId}`;
  }
  switchSession(sessionId: string): void {
    this.sessionId = sessionId;
    this.baseUrl = `/api/chat/${sessionId}`;
  }
  // Session Management Methods
  async createSession(title?: string, sessionId?: string, firstMessage?: string): Promise<{ success: boolean; data?: { sessionId: string; title: string }; error?: string }> {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sessionId, firstMessage })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Session creation failed:', error);
      return { success: false, error: 'Failed to create session' };
    }
  }
  async listSessions(): Promise<{ success: boolean; data?: SessionInfo[]; error?: string }> {
    try {
      const response = await fetch('/api/sessions');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('List sessions failed:', error);
      return { success: false, error: 'Failed to list previous consultations' };
    }
  }
  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Session deletion failed:', error);
      return { success: false, error: 'Failed to archive consultation' };
    }
  }
  async updateSessionTitle(sessionId: string, title: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Title update failed:', error);
      return { success: false, error: 'Failed to update record title' };
    }
  }
  async clearAllSessions(): Promise<{ success: boolean; data?: { deletedCount: number }; error?: string }> {
    try {
      const response = await fetch('/api/sessions', { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Clear all sessions failed:', error);
      return { success: false, error: 'Failed to clear consultation database' };
    }
  }
  async updateModel(model: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to update model:', error);
      return { success: false, error: 'Failed to switch intelligence core' };
    }
  }
}
export const chatService = new ChatService();
export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};
export const generateSessionTitle = (firstUserMessage?: string): string => {
  const now = new Date();
  const dateTime = now.toLocaleString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  if (!firstUserMessage || !firstUserMessage.trim()) {
    return `Consultation ${dateTime}`;
  }
  const cleanMessage = firstUserMessage.trim().replace(/\s+/g, ' ');
  const truncated = cleanMessage.length > 40
    ? cleanMessage.slice(0, 37) + '...'
    : cleanMessage;
  return `${truncated} • ${dateTime}`;
};
export const renderToolCall = (toolCall: ToolCall): string => {
  const result = toolCall.result as WeatherResult | MCPResult | ErrorResult | undefined;
  if (!result) return `⚠️ ${toolCall.name}: No result`;
  if ('error' in result) return `❌ ${toolCall.name}: ${result.error}`;
  if ('content' in result) return `🔧 ${toolCall.name}: Indexing Complete`;
  return `🔧 ${toolCall.name}: Task Done`;
};