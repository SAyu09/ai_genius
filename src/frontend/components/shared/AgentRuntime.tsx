"use client";

import { ChatUI } from "./ChatUI";
import { FormUI } from "./FormUI";
import { WorkflowUI } from "./WorkflowUI";

/**
 * AgentRuntime — Platform UI Router
 *
 * Picks the correct platform-owned UI based on agent type.
 * Seller's backend is called server-side via /api/tools/[agentId]/run.
 * Buyer NEVER sees anything from seller's server. No branding. No contacts. Zero.
 */

export interface AgentConfig {
  inputSchema?: Array<{
    id: string;
    label: string;
    type: "text" | "number" | "textarea" | "select" | "checkbox";
    required?: boolean;
    placeholder?: string;
    options?: string[];
  }>;
  starterMessage?: string;
  inputPlaceholder?: string;
  outputLabel?: string;
}

export interface AgentRuntimeProps {
  agentId: string;
  agentName: string;
  agentType: "chat" | "form" | "workflow";
  agentConfig: AgentConfig | null;
  userId: string;
  planType: string;
}

export function AgentRuntime({
  agentId,
  agentName,
  agentType,
  agentConfig,
  userId,
  planType,
}: AgentRuntimeProps) {
  const config = agentConfig || {};

  switch (agentType) {
    case "chat":
      return (
        <ChatUI
          agentId={agentId}
          agentName={agentName}
          starterMessage={config.starterMessage}
          inputPlaceholder={config.inputPlaceholder}
        />
      );
    case "form":
      return (
        <FormUI
          agentId={agentId}
          agentName={agentName}
          inputSchema={config.inputSchema || []}
          outputLabel={config.outputLabel}
        />
      );
    case "workflow":
      return (
        <WorkflowUI
          agentId={agentId}
          agentName={agentName}
        />
      );
    default:
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Unsupported agent type: {agentType}</p>
        </div>
      );
  }
}
