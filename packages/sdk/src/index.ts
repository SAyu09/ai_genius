/**
 * @aigenius/sdk — AI Genius Marketplace SDK
 *
 * The ENTIRE public API surface:
 *   import { createAgent } from '@aigenius/sdk'
 *   const agent = createAgent({ secret, agentId })
 *   agent.verify(request)  → { userId, agentId, plan } | throws
 *   agent.handler(fn)      → Express/Next.js route handler
 *   agent.stream(gen)      → Pipes async generator as SSE
 */

import { createHmac, timingSafeEqual } from 'crypto';

// ── Public Types ────────────────────────────────────────────────

export interface AgentContext {
  userId: string;
  agentId: string;
  plan: 'monthly' | 'annual' | 'trial';
  metadata: Record<string, string>;
}

export interface AgentRequest {
  type: 'chat' | 'form' | 'workflow';
  messages?: { role: 'user' | 'assistant'; content: string }[];  // chat
  fields?: Record<string, string | number | boolean>;             // form
  step?: string;
  data?: Record<string, unknown>;                                  // workflow
}

export interface AgentResponse {
  type: 'text' | 'stream' | 'steps' | 'error';
  content?: string;
  steps?: { id: string; title: string; status: 'done' | 'error'; output: string }[];
  error?: { code: string; message: string };
}

// ── SDK Error ───────────────────────────────────────────────────

export class SDKError extends Error {
  public code: string;
  public httpStatus: number;

  constructor(code: string, message: string, httpStatus = 401) {
    super(message);
    this.name = 'SDKError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// ── createAgent ─────────────────────────────────────────────────

export function createAgent({ secret, agentId }: { secret: string; agentId: string }) {

  /**
   * Verify HMAC signature from AI Genius platform.
   * Throws SDKError if signature is invalid or request has expired.
   */
  function verify(req: Request): AgentContext {
    const sig       = req.headers.get('X-AIGenius-Signature') ?? '';
    const timestamp = req.headers.get('X-AIGenius-Timestamp') ?? '';
    const payload   = req.headers.get('X-AIGenius-Payload')   ?? '';

    // Replay attack prevention: reject requests older than 5 minutes
    const requestAge = Math.abs(Date.now() - Number(timestamp));
    if (isNaN(requestAge) || requestAge > 5 * 60 * 1000) {
      throw new SDKError('EXPIRED_REQUEST', 'Request timestamp expired');
    }

    // HMAC-SHA256: sig = HMAC(secret, `${timestamp}.${agentId}.${payload}`)
    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${agentId}.${payload}`)
      .digest('hex');

    // Timing-safe comparison prevents timing attacks
    const sigBuf = Buffer.from(sig,      'hex');
    const expBuf = Buffer.from(expected, 'hex');

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new SDKError('INVALID_SIGNATURE', 'Request signature mismatch');
    }

    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8')) as AgentContext;
  }

  /**
   * Wraps seller's function in verify + response formatting.
   * Returns a standard Request → Response handler compatible with any framework.
   */
  function handler(fn: (ctx: AgentContext, req: AgentRequest) => Promise<AgentResponse | Response>) {
    return async (request: Request): Promise<Response> => {
      try {
        const ctx    = verify(request);
        const body   = await request.json() as AgentRequest;
        const result = await fn(ctx, body);

        // If the seller returns a raw Response (e.g. from stream()), pass through
        if (result instanceof Response) {
          return result;
        }

        return Response.json(result, { status: 200 });
      } catch (e) {
        if (e instanceof SDKError) {
          return Response.json(
            { type: 'error', error: { code: e.code, message: e.message } },
            { status: e.httpStatus }
          );
        }
        console.error('[AIGenius SDK]', e);
        return Response.json(
          { type: 'error', error: { code: 'INTERNAL', message: 'Agent error' } },
          { status: 500 }
        );
      }
    };
  }

  /**
   * SSE helper for chat agents.
   * Converts an async generator yielding string tokens into an SSE Response.
   */
  function stream(generator: AsyncGenerator<string>): Response {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        try {
          for await (const token of generator) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    });
  }

  return { verify, handler, stream };
}
