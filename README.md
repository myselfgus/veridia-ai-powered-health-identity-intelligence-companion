# Cloudflare AI Chat Agent

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/myselfgus/veridia-ai-powered-health-identity-intelligence-companion)

A production-ready full-stack template for building AI-powered chat applications using Cloudflare Workers, Durable Objects, and the Agents SDK. Features streaming responses, tool calling, session management, and a polished React frontend.

## Features

- **Intelligent Chat Agent**: Powered by OpenAI-compatible models via Cloudflare AI Gateway with streaming support
- **Tool Integration**: Built-in tools for weather queries, web search (SerpAPI), and MCP server support
- **Session Management**: Persistent chat sessions with title generation, activity tracking, and bulk operations
- **Modern UI**: Responsive interface with dark/light themes, animations, and accessible components
- **Type-Safe**: Full TypeScript coverage across frontend and worker code
- **Developer Experience**: Hot reloading, comprehensive error handling, and easy extensibility

## Tech Stack

**Frontend**
- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui components
- TanStack Query, React Router, Immer for state
- Lucide icons, Sonner for toasts

**Backend**
- Cloudflare Workers + Durable Objects (Agents SDK)
- OpenAI SDK integration
- MCP client for external tool servers
- Hono for routing

**Tooling**
- Bun package manager
- Wrangler for deployment
- ESLint + TypeScript strict checks

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Cloudflare account (for deployment)
- OpenAI API key or Cloudflare AI Gateway access

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd veridia-xq2fwcoj1srfzyug2rjl-

# Install dependencies
bun install
```

### Environment Configuration

Update `wrangler.jsonc` with your credentials:

```jsonc
{
  "vars": {
    "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/openai",
    "CF_AI_API_KEY": "your-cloudflare-api-key",
    "SERPAPI_KEY": "optional-for-web-search"
  }
}
```

## Usage

### Development

Start the local development server:

```bash
bun run dev
```

The app will be available at `http://localhost:3000` (or the port specified in your environment).

### Chat Features

- Send messages to the AI agent with real-time streaming responses
- Switch between available models (Gemini 2.5 Flash, Pro, etc.)
- Use built-in tools via natural language ("What's the weather in Paris?")
- Manage multiple chat sessions with automatic title generation

### Extending the Agent

Add new tools in `worker/tools.ts` or integrate additional MCP servers in `worker/mcp-client.ts`.

## Deployment

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/myselfgus/veridia-ai-powered-health-identity-intelligence-companion)

Deploy to Cloudflare Workers with a single command:

```bash
bun run deploy
```

Or use Wrangler directly:

```bash
bun run build
wrangler deploy
```

The template automatically configures Durable Objects, migrations, and static asset serving.

## Project Structure

```
src/           # React frontend (pages, components, hooks)
worker/        # Cloudflare Workers (agents, chat logic, tools)
shared/        # Shared TypeScript types (if applicable)
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.