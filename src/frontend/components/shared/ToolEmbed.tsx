"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ToolUnavailable } from "./ToolUnavailable";

interface ToolEmbedProps {
  /** The seller's embed URL */
  embedUrl: string;
  /** Agent ID for token refresh */
  agentId: string;
  /** Agent name for display */
  agentName: string;
  /** Initial token from server */
  initialToken: string;
}

/**
 * Embeds the seller's tool inside a sandboxed iframe.
 * Passes auth token via postMessage (NEVER in URL query params).
 * Proactively refreshes the token every 4 minutes before the 5-min expiry.
 */
export function ToolEmbed({
  embedUrl,
  agentId,
  agentName,
  initialToken,
}: ToolEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [token, setToken] = useState(initialToken);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Extract seller origin from embed URL for strict targetOrigin
  const sellerOrigin = (() => {
    try {
      return new URL(embedUrl).origin;
    } catch {
      return "";
    }
  })();

  /** Send token to seller iframe via postMessage */
  const sendToken = useCallback(
    (t: string) => {
      if (!iframeRef.current?.contentWindow || !sellerOrigin) return;
      // SECURITY: NEVER use '*' — always use the seller's exact origin
      iframeRef.current.contentWindow.postMessage(
        { type: "PLATFORM_AUTH_TOKEN", token: t },
        sellerOrigin
      );
    },
    [sellerOrigin]
  );

  /** Refresh token from API */
  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/tools/${agentId}/token`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Token refresh failed");
      const data = await res.json();
      setToken(data.token);
      // Send the new token immediately
      sendToken(data.token);
    } catch (err) {
      console.error("[ToolEmbed] Token refresh failed:", err);
    }
  }, [agentId, sendToken]);

  // When iframe loads, send the initial token
  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    setIframeError(false);
    sendToken(token);
  }, [sendToken, token]);

  // Set up proactive token refresh every 4 minutes
  useEffect(() => {
    refreshInterval.current = setInterval(refreshToken, 4 * 60 * 1000);
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [refreshToken]);

  // Handle iframe load errors
  const handleIframeError = useCallback(() => {
    setIframeError(true);
  }, []);

  if (iframeError || !embedUrl) {
    return <ToolUnavailable agentName={agentName} />;
  }

  return (
    <div className="relative w-full h-full">
      {!iframeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading {agentName}...
            </p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full border-none"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="microphone; camera; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        title={`${agentName} - AI Genius`}
      />
    </div>
  );
}
