"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Copy, Key, Loader2, CheckCircle, RefreshCw, AlertCircle, Link2, Check, Hash } from "lucide-react";
import { toast } from "sonner";

type Agent = {
  id: string;
  name: string;
  endpointUrl: string | null;
};

function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = useCallback(async (text: string, key: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(label ? `${label} copied!` : "Copied to clipboard!");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  return { copiedKey, copy };
}

export function DeveloperCredentialsCard({ agents }: { agents: Agent[] }) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || "");
  const [endpointInput, setEndpointInput] = useState<string>(agents[0]?.endpointUrl || '');
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const { copiedKey, copy } = useCopyToClipboard();

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const handleSelect = (id: string) => {
    setSelectedAgentId(id);
    setSecret(null);
    setTestResult(null);
    const agent = agents.find(a => a.id === id);
    setEndpointInput(agent?.endpointUrl || '');
  };

  const fetchSecret = async () => {
    if (!selectedAgentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sellers/agents/${selectedAgentId}/regenerate-secret`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setSecret(data.secret);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!selectedAgentId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/sellers/agents/${selectedAgentId}/test-endpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointUrl: endpointInput })
      });
      const data = await res.json();
      if (res.ok && data.passed) {
        setTestResult('success');
      } else {
        setTestResult('failed');
      }
    } catch {
      setTestResult('failed');
    } finally {
      setTesting(false);
    }
  };

  if (agents.length === 0) {
    return (
      <Card className="rounded-3xl border-dashed bg-card/50 shadow-sm">
        <CardContent className="p-8 text-center">
          <Key className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No SDK Agents Found</h3>
          <p className="text-sm text-muted-foreground">You don't have any active Chat or Form agents. Create one in your listings to generate credentials.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-primary-subtle border-2 border-primary rounded-2xl overflow-hidden shadow-sm mb-12">
      <div className="bg-white/50 border-b border-primary/20 p-4 px-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <Key className="h-5 w-5" />
          SDK Configuration Panel
        </h2>
      </div>
      
      <div className="p-6 md:p-8">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Selection & Status */}
          <div className="md:col-span-5 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">1. Select your Agent</label>
              <select 
                value={selectedAgentId} 
                onChange={(e) => handleSelect(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary shadow-sm"
              >
                <option value="" disabled>Choose an agent to configure...</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Agent ID with Copy */}
            {selectedAgent && (
              <div className="space-y-2 animate-in fade-in duration-500">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="h-3 w-3" /> Agent ID
                </label>
                <div className="flex items-center gap-2 bg-white/60 border border-primary/20 rounded-lg px-3 py-2">
                  <code className="flex-1 min-w-0 text-xs font-mono text-gray-700 truncate select-all">{selectedAgent.id}</code>
                  <button
                    onClick={() => copy(selectedAgent.id, "agentId", "Agent ID")}
                    className="shrink-0 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                    aria-label="Copy Agent ID"
                  >
                    {copiedKey === "agentId" ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Endpoint URL with Copy */}
            {selectedAgent && (
              <div className="space-y-2 animate-in fade-in duration-500 pt-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Target Endpoint</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-white/60 border border-primary/20 rounded-lg px-3 py-1 w-full overflow-hidden">
                    <Link2 className="h-4 w-4 text-gray-500 shrink-0" />
                    <input
                      type="url"
                      value={endpointInput}
                      onChange={(e) => setEndpointInput(e.target.value)}
                      placeholder="https://api.yourdomain.com/webhook"
                      className="flex-1 min-w-0 text-sm font-medium text-gray-900 bg-transparent outline-none placeholder:text-gray-400 h-8"
                    />
                    {endpointInput && (
                      <button
                        onClick={() => copy(endpointInput, "endpoint", "Endpoint URL")}
                        className="shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Copy Endpoint URL"
                      >
                        {copiedKey === "endpoint" ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="shrink-0 w-full sm:w-auto rounded-lg text-xs h-8"
                    disabled={endpointInput === (selectedAgent.endpointUrl || '')}
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/sellers/agents/${selectedAgentId}/test-endpoint`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ endpointUrl: endpointInput })
                        });
                        if (res.ok) {
                          toast.success('Endpoint saved!');
                        }
                      } catch { toast.error('Failed to save'); }
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Credentials & Testing */}
          <div className="md:col-span-7">
            {!selectedAgent ? (
              <div className="h-full flex items-center justify-center min-h-[160px] border border-dashed border-primary/40 bg-white/40 rounded-xl">
                <span className="text-sm font-medium text-gray-500">Select an agent to view its secret</span>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                
                {/* Secret Key Area */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span>2. Secret Key</span>
                    <span className="text-[10px] text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Keep Private</span>
                  </label>
                  
                  <div className="bg-white border border-primary/20 shadow-sm rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3">
                    {secret ? (
                      <>
                        <div className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 font-mono text-sm px-4 py-2.5 rounded-lg w-full break-all">
                          {secret}
                        </div>
                        <Button
                          size="default"
                          className="shrink-0 w-full sm:w-auto gap-2"
                          onClick={() => copy(secret, "secret", "Secret key")}
                        >
                          {copiedKey === "secret" ? (
                            <>
                              <Check className="h-4 w-4 text-green-300" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy Secret
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={fetchSecret} disabled={loading} size="default" variant="outline" className="w-full rounded-lg gap-2 border-dashed border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 py-6">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Key className="h-5 w-5" />}
                        Reveal AIGenius_SECRET
                      </Button>
                    )}
                  </div>
                </div>

                {/* Connection Test Area */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">3. Connection Health</label>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/60 border border-primary/20 rounded-xl p-3 gap-3">
                    <div className="flex-1 px-2">
                      {testResult === "success" ? (
                        <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                          <CheckCircle className="h-4 w-4" /> Verified! Endpoint is ready.
                        </div>
                      ) : testResult === "failed" ? (
                        <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                          <AlertCircle className="h-4 w-4" /> Connection failed. Check logs.
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Verify your backend integration.</span>
                      )}
                    </div>
                    
                    <Button onClick={testConnection} variant="secondary" disabled={testing || !endpointInput} className="rounded-lg shrink-0 gap-2 w-full sm:w-auto">
                      {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Send Ping Test
                    </Button>
                  </div>
                </div>

              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
