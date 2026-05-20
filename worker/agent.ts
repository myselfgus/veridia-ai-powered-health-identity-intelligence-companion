import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage, createStreamResponse, createEncoder } from './utils';
/**
 * ChatAgent - Main agent class using Cloudflare Agents SDK
 *
 * Enhanced with robustness features to prevent 500 crashes and provide better diagnostic logging.
 */
export class ChatAgent extends Agent<Env, ChatState> {
  private chatHandler?: ChatHandler;
  // Initial state for new chat sessions
  initialState: ChatState = {
    messages: [],
    sessionId: crypto.randomUUID(),
    isProcessing: false,
    model: 'google-ai-studio/gemini-2.5-flash'
  };
  /**
   * Initialize chat handler when agent starts
   */
  async onStart(): Promise<void> {
    try {
      this.chatHandler = new ChatHandler(
        this.env.CF_AI_BASE_URL,
        this.env.CF_AI_API_KEY,
        this.state.model || this.initialState.model
      );
      console.log(`[INIT] ChatAgent ${this.name} initialized with model ${this.state.model}`);
    } catch (error) {
      console.error(`[CRITICAL] Failed to initialize ChatAgent ${this.name}:`, error);
    }
  }
  /**
   * Handle incoming requests - clean routing with global error boundary
   */
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    try {
      // Ensure basic handler state
      if (!this.chatHandler) {
        await this.onStart();
      }
      // Route to appropriate handler
      if (method === 'GET' && url.pathname === '/messages') {
        return this.handleGetMessages();
      }
      if (method === 'POST' && url.pathname === '/chat') {
        const body = await request.json().catch(() => ({}));
        return this.handleChatMessage(body as any);
      }
      if (method === 'DELETE' && url.pathname === '/clear') {
        return this.handleClearMessages();
      }
      if (method === 'POST' && url.pathname === '/model') {
        const body = await request.json().catch(() => ({}));
        return this.handleModelUpdate(body as any);
      }
      return Response.json({
        success: false,
        error: API_RESPONSES.NOT_FOUND
      }, { status: 404 });
    } catch (error) {
      console.error(`[ERROR] Internal Agent Failure on ${method} ${url.pathname}:`, error);
      return Response.json({
        success: false,
        error: API_RESPONSES.INTERNAL_ERROR,
        detail: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  }
  /**
   * Get current conversation messages
   */
  private handleGetMessages(): Response {
    // Robust check for state presence
    if (!this.state || typeof this.state !== 'object') {
      console.warn(`[WARN] State missing for agent ${this.name}, using initial state`);
      return Response.json({
        success: true,
        data: this.initialState
      });
    }
    return Response.json({
      success: true,
      data: this.state
    });
  }
  /**
   * Process new chat message
   */
  private async handleChatMessage(body: { message: string; model?: string; stream?: boolean }): Promise<Response> {
    const { message, model, stream } = body;
    // Validate input
    if (!message?.trim()) {
      return Response.json({
        success: false,
        error: API_RESPONSES.MISSING_MESSAGE
      }, { status: 400 });
    }
    // Update model if provided and different
    if (model && model !== this.state.model) {
      this.setState({ ...this.state, model });
      this.chatHandler?.updateModel(model);
    }
    const userMessage = createMessage('user', message.trim());
    this.setState({
      ...this.state,
      messages: [...(this.state.messages || []), userMessage],
      isProcessing: true
    });
    try {
      if (!this.chatHandler) {
        throw new Error('Intelligence logic (ChatHandler) not available');
      }
      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = createEncoder();
        // Start processing in background
        (async () => {
          try {
            this.setState({ ...this.state, streamingMessage: '' });
            const response = await this.chatHandler!.processMessage(
              message,
              this.state.messages,
              (chunk: string) => {
                try {
                  this.setState({
                    ...this.state,
                    streamingMessage: (this.state.streamingMessage || '') + chunk
                  });
                  writer.write(encoder.encode(chunk));
                } catch (writeError) {
                  console.error('[WRITE ERROR] Failed to push chunk to stream:', writeError);
                }
              }
            );
            const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
            this.setState({
              ...this.state,
              messages: [...this.state.messages, assistantMessage],
              isProcessing: false,
              streamingMessage: ''
            });
          } catch (error) {
            console.error('[STREAM ERROR] Failed to process streaming message:', error);
            try {
              const errorMessage = 'I encountered a disruption in the intelligence stream. Please try again.';
              writer.write(encoder.encode(errorMessage));
              const errorMsg = createMessage('assistant', errorMessage);
              this.setState({
                ...this.state,
                messages: [...(this.state.messages || []), errorMsg],
                isProcessing: false,
                streamingMessage: ''
              });
            } catch (writeError) {
              console.error('[RECOVERY ERROR] Failed to write error fallback to stream:', writeError);
            }
          } finally {
            try {
              writer.close();
            } catch (closeError) {
              console.error('[CLOSE ERROR] Failed to close stream writer:', closeError);
            }
          }
        })();
        return createStreamResponse(readable);
      }
      // Non-streaming response
      const response = await this.chatHandler.processMessage(
        message,
        this.state.messages
      );
      const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
      this.setState({
        ...this.state,
        messages: [...this.state.messages, assistantMessage],
        isProcessing: false
      });
      return Response.json({
        success: true,
        data: this.state
      });
    } catch (error) {
      console.error('[PROCESS ERROR] Failed to handle chat message:', error);
      this.setState({ ...this.state, isProcessing: false });
      return Response.json({
        success: false,
        error: API_RESPONSES.PROCESSING_ERROR,
        detail: error instanceof Error ? error.message : 'Chat system processing failure'
      }, { status: 500 });
    }
  }
  /**
   * Clear conversation history
   */
  private handleClearMessages(): Response {
    this.setState({
      ...this.state,
      messages: []
    });
    return Response.json({
      success: true,
      data: this.state
    });
  }
  /**
   * Update selected AI model
   */
  private handleModelUpdate(body: { model: string }): Response {
    const { model } = body;
    if (!model) return Response.json({ success: false, error: 'Model name required' }, { status: 400 });
    this.setState({ ...this.state, model });
    this.chatHandler?.updateModel(model);
    return Response.json({
      success: true,
      data: this.state
    });
  }
}