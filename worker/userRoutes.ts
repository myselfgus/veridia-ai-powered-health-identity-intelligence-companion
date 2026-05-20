import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
/**
 * DO NOT MODIFY THIS FUNCTION. Only for your reference.
 */
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
    // Use this API for conversations. **DO NOT MODIFY**
    app.all('/api/chat/:sessionId/*', async (c) => {
        const sessionId = c.req.param('sessionId');
        // Basic sessionId validation
        if (!sessionId || sessionId.length < 8) {
            return c.json({
                success: false,
                error: 'Invalid session context'
            }, { status: 400 });
        }
        try {
            // Hardened agent retrieval
            const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId); 
            const url = new URL(c.req.url);
            url.pathname = url.pathname.replace(`/api/chat/${sessionId}`, '');
            return agent.fetch(new Request(url.toString(), {
                method: c.req.method,
                headers: c.req.header(),
                body: c.req.method === 'GET' || c.req.method === 'DELETE' ? undefined : c.req.raw.body
            }));
        } catch (error) {
            console.error(`[ROUTING ERROR] Agent allocation failed for session ${sessionId}:`, error);
            return c.json({
                success: false,
                error: API_RESPONSES.AGENT_ROUTING_FAILED,
                detail: error instanceof Error ? error.message : 'Internal routing failure'
            }, { status: 500 });
        }
    });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    /**
     * List all chat sessions
     */
    app.get('/api/sessions', async (c) => {
        try {
            const controller = getAppController(c.env);
            const sessions = await controller.listSessions();
            return c.json({ success: true, data: sessions });
        } catch (error) {
            console.error('[CONTROLLER ERROR] Failed to list sessions:', error);
            return c.json({
                success: false,
                error: 'Session history unavailable'
            }, { status: 500 });
        }
    });
    /**
     * Create a new chat session
     */
    app.post('/api/sessions', async (c) => {
        try {
            const body = await c.req.json().catch(() => ({}));
            const { title, sessionId: providedSessionId, firstMessage } = body;
            const sessionId = providedSessionId || crypto.randomUUID();
            let sessionTitle = title;
            if (!sessionTitle) {
                const now = new Date();
                const dateTime = now.toLocaleString([], {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                if (firstMessage && firstMessage.trim()) {
                    const cleanMessage = firstMessage.trim().replace(/\s+/g, ' ');
                    const truncated = cleanMessage.length > 40
                        ? cleanMessage.slice(0, 37) + '...'
                        : cleanMessage;
                    sessionTitle = `${truncated} • ${dateTime}`;
                } else {
                    sessionTitle = `Consult ${dateTime}`;
                }
            }
            // Fallback strategy for controller registration
            try {
                await registerSession(c.env, sessionId, sessionTitle);
            } catch (regError) {
                console.warn('[REGISTRATION WARN] Failed to register with controller, session remains local:', regError);
            }
            return c.json({
                success: true,
                data: { sessionId, title: sessionTitle }
            });
        } catch (error) {
            console.error('[SESSION ERROR] Failed to initialize consult:', error);
            return c.json({
                success: false,
                error: 'Consult initialization failed'
            }, { status: 500 });
        }
    });
    /**
     * Delete a chat session
     */
    app.delete('/api/sessions/:sessionId', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const deleted = await unregisterSession(c.env, sessionId);
            if (!deleted) {
                return c.json({
                    success: false,
                    error: 'Session archive not found'
                }, { status: 404 });
            }
            return c.json({ success: true, data: { deleted: true } });
        } catch (error) {
            console.error('[DELETE ERROR] Failed to purge session:', error);
            return c.json({
                success: false,
                error: 'Purge operation failed'
            }, { status: 500 });
        }
    });
    /**
     * Update session title
     */
    app.put('/api/sessions/:sessionId/title', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const { title } = await c.req.json().catch(() => ({}));
            if (!title || typeof title !== 'string') {
                return c.json({
                    success: false,
                    error: 'Label required'
                }, { status: 400 });
            }
            const controller = getAppController(c.env);
            const updated = await controller.updateSessionTitle(sessionId, title);
            if (!updated) {
                return c.json({
                    success: false,
                    error: 'Session not found'
                }, { status: 404 });
            }
            return c.json({ success: true, data: { title } });
        } catch (error) {
            console.error('[UPDATE ERROR] Failed to update label:', error);
            return c.json({
                success: false,
                error: 'Update failed'
            }, { status: 500 });
        }
    });
    /**
     * Get session count and stats
     */
    app.get('/api/sessions/stats', async (c) => {
        try {
            const controller = getAppController(c.env);
            const count = await controller.getSessionCount();
            return c.json({
                success: true,
                data: { totalSessions: count }
            });
        } catch (error) {
            return c.json({ success: false, error: 'Stats unavailable' }, { status: 500 });
        }
    });
    /**
     * Clear all chat sessions
     */
    app.delete('/api/sessions', async (c) => {
        try {
            const controller = getAppController(c.env);
            const deletedCount = await controller.clearAllSessions();
            return c.json({
                success: true,
                data: { deletedCount }
            });
        } catch (error) {
            return c.json({ success: false, error: 'Bulk purge failed' }, { status: 500 });
        }
    });
}