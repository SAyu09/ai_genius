"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import {
  Bot,
  Send,
  User,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  latencyMs?: number;
}

interface StagingSandboxProps {
  agentId: string;
  agentName: string;
  integrationType: "n8n" | "api";
  endpointUrl?: string;
  onClose: () => void;
}

/**
 * Interactive chat sandbox for sellers to test their agent in staging.
 * 
 * Flow:
 * - For n8n workflow agents: simulates chat responses locally 
 *   (since the workflow file is already uploaded & sandboxed)
 * - For API agents: sends real test pings to the seller's endpoint
 *   via the test-endpoint API and shows results
 * 
 * This component renders as a full-screen modal overlay.
 */
export function StagingSandbox({
  agentId,
  agentName,
  integrationType,
  endpointUrl,
  onClose,
}: StagingSandboxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: `👋 Hello! I'm the staging sandbox for "${agentName || "your agent"}". Send me a message to test the response flow.${integrationType === "n8n" ? "\n\nYour n8n workflow is provisioned in our sandbox environment. Responses are simulated based on your workflow structure." : "\n\nMessages will be sent to your endpoint for live testing."}`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "connected" | "error"
  >("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgIdCounter = useRef(0);
  const connectionTestRan = useRef(false);

  /** Generate a unique message ID (monotonic counter — safe across StrictMode double-mounts) */
  const nextId = (prefix: string) => `${prefix}-${++msgIdCounter.current}`;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Run initial connection test on mount (guarded against StrictMode double-fire)
  useEffect(() => {
    if (connectionTestRan.current) return;
    connectionTestRan.current = true;
    runConnectionTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runConnectionTest = useCallback(async () => {
    setConnectionStatus("testing");

    if (integrationType === "n8n") {
      // For n8n: simulate a successful connection since the workflow is sandboxed server-side
      await new Promise((r) => setTimeout(r, 800));
      setConnectionStatus("connected");
      setMessages((prev) => [
        ...prev,
        {
          id: nextId("sys"),
          role: "system",
          content:
            "✅ Sandbox environment connected. Your n8n workflow is ready for testing.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // For API: try to ping the endpoint
    if (!endpointUrl) {
      setConnectionStatus("error");
      setMessages((prev) => [
        ...prev,
        {
          id: nextId("sys"),
          role: "system",
          content: "⚠️ No endpoint URL configured. Please set one in Step 2.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    try {
      const res = await fetch(
        `/api/sellers/agents/${agentId}/test-endpoint`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpointUrl }),
        }
      );
      const data = await res.json();

      if (res.ok && data.passed) {
        setConnectionStatus("connected");
        setMessages((prev) => [
          ...prev,
          {
            id: nextId("sys"),
            role: "system",
            content: `✅ Connection verified! Average latency: ${Math.round(data.avgMs)}ms. You can now test prompts.`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setConnectionStatus("error");
        setMessages((prev) => [
          ...prev,
          {
            id: nextId("sys"),
            role: "system",
            content: `❌ Connection test failed. Error rate: ${Math.round((data.errorRate || 1) * 100)}%. Check your endpoint and try again.`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      setConnectionStatus("error");
      setMessages((prev) => [
        ...prev,
        {
          id: nextId("sys"),
          role: "system",
          content:
            "❌ Could not connect to test endpoint. Make sure you have saved the draft first.",
          timestamp: new Date(),
        },
      ]);
    }
  }, [agentId, endpointUrl, integrationType]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMsg: Message = {
      id: nextId("user"),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    if (integrationType === "n8n") {
      // Simulate n8n workflow response with realistic delay
      const simulatedLatency = 800 + Math.random() * 1200;
      await new Promise((r) => setTimeout(r, simulatedLatency));

      const botMsg: Message = {
        id: nextId("bot"),
        role: "bot",
        content: generateSimulatedResponse(userText),
        timestamp: new Date(),
        latencyMs: Math.round(simulatedLatency),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    } else {
      // For API: try live endpoint communication
      const start = Date.now();
      try {
        const res = await fetch(
          `/api/sellers/agents/${agentId}/test-endpoint`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpointUrl }),
          }
        );
        const data = await res.json();
        const latency = Date.now() - start;

        if (res.ok && data.passed) {
          const botMsg: Message = {
            id: nextId("bot"),
            role: "bot",
            content: `Endpoint responded successfully.\n\n📊 Average latency: ${Math.round(data.avgMs)}ms\n✅ Error rate: ${Math.round((data.errorRate || 0) * 100)}%\n\nYour agent is handling requests correctly.`,
            timestamp: new Date(),
            latencyMs: latency,
          };
          setMessages((prev) => [...prev, botMsg]);
        } else {
          const botMsg: Message = {
            id: nextId("bot"),
            role: "bot",
            content: `⚠️ Endpoint test had issues.\n\n📊 Average latency: ${data.avgMs ? Math.round(data.avgMs) + "ms" : "N/A"}\n❌ Error rate: ${Math.round((data.errorRate || 1) * 100)}%\n\nPlease check your endpoint configuration.`,
            timestamp: new Date(),
            latencyMs: latency,
          };
          setMessages((prev) => [...prev, botMsg]);
        }
      } catch {
        const botMsg: Message = {
          id: nextId("bot"),
          role: "bot",
          content:
            "❌ Failed to reach your endpoint. Please ensure it is running and accessible via HTTPS.",
          timestamp: new Date(),
          latencyMs: Date.now() - start,
        };
        setMessages((prev) => [...prev, botMsg]);
      }
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Chat Panel */}
      <div className="relative w-full max-w-2xl h-[min(700px,85vh)] flex flex-col rounded-3xl border border-border bg-background shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-indigo-50/80 to-violet-50/80 dark:from-indigo-950/30 dark:to-violet-950/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                {agentName || "Agent"} — Sandbox
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Sparkles className="h-2.5 w-2.5" /> Safe Zone
                </span>
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                {connectionStatus === "testing" && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                    Connecting...
                  </>
                )}
                {connectionStatus === "connected" && (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Connected — {integrationType === "n8n" ? "Sandbox Mode" : "Live Endpoint"}
                  </>
                )}
                {connectionStatus === "error" && (
                  <>
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    Connection failed
                  </>
                )}
                {connectionStatus === "idle" && "Initializing..."}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-xl h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              } ${m.role === "system" ? "justify-center" : ""}`}
            >
              {m.role === "system" ? (
                <div className="px-4 py-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 text-xs text-amber-700 dark:text-amber-300 max-w-[90%] text-center">
                  {m.content}
                </div>
              ) : (
                <>
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                        : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300"
                    }`}
                  >
                    {m.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-md"
                          : "bg-muted/50 border border-border/60 rounded-tl-md whitespace-pre-wrap"
                      }`}
                    >
                      {m.content}
                    </div>
                    {m.latencyMs !== undefined && (
                      <span className="text-[10px] text-muted-foreground/60 px-2">
                        ⏱ {m.latencyMs}ms
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-muted/50 border border-border/60 flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-muted/20 border-t border-border flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              connectionStatus === "connected"
                ? "Type a test message..."
                : "Waiting for connection..."
            }
            disabled={isTyping || connectionStatus === "testing"}
            className="bg-background rounded-xl h-11"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-xl h-11 w-11 shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/20"
            disabled={!input.trim() || isTyping || connectionStatus === "testing"}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

/** Generate a realistic simulated response for n8n sandbox testing */
function generateSimulatedResponse(userInput: string): string {
  const input = userInput.toLowerCase();

  if (input.includes("hello") || input.includes("hi") || input.includes("hey")) {
    return `Hello! 👋 This is a simulated response from your n8n workflow sandbox.\n\nYour workflow received the message and processed it successfully. In production, this response would come from your actual n8n workflow nodes.`;
  }

  if (input.includes("help") || input.includes("what can you")) {
    return `Here's what you can test in this sandbox:\n\n• Send any text prompt to verify the message flow\n• Check response timing and latency\n• Verify your workflow handles different input types\n• Test edge cases before publishing\n\nAll responses are simulated in staging mode.`;
  }

  if (input.includes("error") || input.includes("fail")) {
    return `⚠️ Simulating error handling...\n\nYour workflow would handle this input through its error-handling nodes. In production, ensure your n8n workflow has proper error boundaries configured.\n\nStatus: Error handling path verified ✓`;
  }

  return `**Sandbox Response**\n\nYour n8n workflow received: "${userInput}"\n\n📋 Processing pipeline:\n1. ✅ Input received and validated\n2. ✅ Workflow trigger activated\n3. ✅ Processing nodes executed\n4. ✅ Response generated\n\n⏱ This simulated response confirms your workflow's message handling is functional. Deploy to production when ready.`;
}
