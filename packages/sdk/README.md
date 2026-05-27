# aigenius-agent-sdk

The official SDK for building and monetizing AI Agents on the AI Genius platform. This SDK provides secure request verification, payload decoding, and easy response formatting for your AI agents.

## Installation

```bash
npm install aigenius-agent-sdk
```

## Quick Start (Next.js App Router)

Create an API route in your Next.js project (e.g. `app/api/agent/route.ts`):

```typescript
import { createAgent } from "aigenius-agent-sdk";

// Initialize the agent with your credentials from the AI Genius Developer Dashboard
const agent = createAgent({
  secret: process.env.AIGENIUS_SDK_SECRET!,
  agentId: process.env.AIGENIUS_AGENT_ID!,
});

export const POST = agent.handler(async (ctx, req) => {
  // ctx contains the verified user data and billing plan
  console.log(\`User \${ctx.userId} is on the \${ctx.plan} plan.\`);

  // Handle a standard chat request
  if (req.type === "chat") {
    const lastMessage = req.messages?.pop();
    
    // Process with your AI...
    if (lastMessage?.content === "ping") {
      return {
        type: "text",
        content: "pong",
      };
    }
  }

  return { type: "text", content: "I am ready to help!" };
});
```

## Streaming Responses

If your AI model supports streaming (like OpenAI), you can use the `agent.stream()` helper to pipe the response directly to the AI Genius marketplace:

```typescript
export const POST = agent.handler(async (ctx, req) => {
  // Create an async generator that yields string chunks
  async function* generateResponse() {
    yield "Hello ";
    await new Promise((r) => setTimeout(r, 500));
    yield "World!";
  }

  // Return the stream directly
  return agent.stream(generateResponse());
});
```

## Security

The SDK automatically verifies HMAC-SHA256 signatures from the AI Genius platform to ensure that:
1. The request legitimately originated from AI Genius.
2. The user context (`ctx`) is cryptographically trusted.
3. The request is not a replay attack (timestamp verification).

If verification fails, the SDK will automatically return a `401 Unauthorized` response.
