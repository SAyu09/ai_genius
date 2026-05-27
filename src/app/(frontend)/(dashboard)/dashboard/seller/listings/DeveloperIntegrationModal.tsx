"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/frontend/components/ui/dialog";
import { Code, Copy, RefreshCw, Key, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/frontend/components/ui/input";

export function DeveloperIntegrationModal({ agentId, endpointUrl }: { agentId: string, endpointUrl: string | null }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchSecret = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sellers/agents/${agentId}/regenerate-secret`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setSecret(data.secret);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/sellers/agents/${agentId}/test-endpoint`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult("success");
      } else {
        setTestResult("failed");
      }
    } catch {
      setTestResult("failed");
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1.5 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
          <Code className="h-3.5 w-3.5" /> SDK Integration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>SDK Integration details</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure your backend endpoint and view your integration credentials.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Your Backend Endpoint</div>
            <div className="text-xs text-muted-foreground mb-1">We will send HMAC-signed POST requests to this URL.</div>
            <div className="flex gap-2">
              <Input value={endpointUrl || "Not set"} readOnly className="h-10 text-xs bg-muted/50 rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">AIGenius_SECRET</div>
            <div className="text-xs text-muted-foreground mb-1">Use this secret to verify the HMAC signature in your backend using the <code>aigenius-agent-sdk</code>.</div>
            
            {secret ? (
              <div className="flex gap-2">
                <Input value={secret} readOnly className="h-10 text-xs font-mono bg-muted/50 rounded-xl" />
                <Button size="icon" variant="outline" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => copyToClipboard(secret)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={fetchSecret} disabled={loading} variant="outline" className="w-full rounded-xl h-10 gap-2 border-dashed">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                Generate / Reveal Secret
              </Button>
            )}
          </div>

          <div className="rounded-xl border p-4 bg-muted/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Connection Test</div>
              <Button size="sm" onClick={testConnection} disabled={testing || !endpointUrl} className="rounded-lg h-8 text-xs gap-1.5">
                {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Send Ping
              </Button>
            </div>
            
            {testResult === "success" && (
              <div className="flex items-start gap-2 text-green-600 text-xs bg-green-500/10 p-2.5 rounded-lg border border-green-500/20">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>Connection verified! Your endpoint is successfully handling our HMAC signatures and returning valid responses.</div>
              </div>
            )}
            
            {testResult === "failed" && (
              <div className="flex items-start gap-2 text-red-600 text-xs bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>Connection failed. Make sure your server is running, publicly accessible, and correctly using the <code>verify()</code> method from the SDK with your current secret.</div>
              </div>
            )}
            
            {!testResult && (
              <div className="text-xs text-muted-foreground">
                We will send 5 sequential ping requests to your endpoint to verify latency and signature handling.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
