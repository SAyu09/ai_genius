"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { ArrowLeft, Bot, UploadCloud, FileText, Database, ShieldCheck, Rocket, RefreshCw, Key, Play, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { StagingSandbox } from "./StagingSandbox";

export default function CreatorStudioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ passed: boolean; message?: string; errorRate?: number; avgMs?: number } | null>(null);
  const [activeTab, setActiveTab] = useState("basics");
  
  const [form, setForm] = useState({
    name: "",
    tag: "",
    description: "",
    longDesc: "",
    category: "",
    price: "",
    pricingModel: "usage_based", // newly added in phase 2
    agentType: "chat",
    integrationType: "n8n", // "n8n" or "api"
    endpointUrl: "",
    assetKey: "",
    workflowData: null as any,
  });

  const [draftId, setDraftId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [pastedJson, setPastedJson] = useState("");
  const [jsonError, setJsonError] = useState("");

  const handleProcessPastedJson = async () => {
    try {
      setJsonError("");
      const parsed = JSON.parse(pastedJson);
      
      setUploadingFile(true);
      const filename = `pasted-workflow-${Date.now()}.json`;
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      
      if (!res.ok || !data.uploadUrl) throw new Error(data.error || "Failed to get upload URL");
      
      await fetch(data.uploadUrl, {
        method: "PUT",
        body: pastedJson,
        headers: { "Content-Type": "application/json" }
      });
      
      setForm({ ...form, assetKey: data.path, workflowData: parsed });
      toast.success("Workflow JSON processed successfully!");
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setJsonError("Invalid JSON format");
      } else {
        toast.error(err.message || "Processing failed");
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        monthlyPrice: form.price || "0",
        type: form.integrationType === "n8n" ? "workflow" : "hosted",
      };

      const url = draftId ? `/api/agents/${draftId}` : "/api/agents";
      const method = draftId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save draft");

      if (!draftId) {
        setDraftId(data.agent.id);
      }
      
      // Auto-generate SDK Secret
      try {
        const secRes = await fetch(`/api/sellers/agents/${data.agent.id}/regenerate-secret`, { method: "POST" });
        if (secRes.ok) {
           const secData = await secRes.json();
           setSecret(secData.secret);
        }
      } catch (e) {
        // non-blocking
      }
      
      toast.success("Agent saved to Staging Safe Zone!");
      setActiveTab("setup");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [uploadingFile, setUploadingFile] = useState(false);
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingFile(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name })
      });
      const data = await res.json();
      
      if (!res.ok || !data.uploadUrl) throw new Error(data.error || "Failed to get upload URL");
      
      await fetch(data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });
      
      const fileText = await file.text();
      let parsed = null;
      try {
        parsed = JSON.parse(fileText);
      } catch (e) {
        console.warn("Could not parse workflow JSON");
      }
      
      setForm({ ...form, assetKey: data.path, workflowData: parsed });
      toast.success("Workflow file uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleOpenSandbox = () => {
    if (!draftId) {
      toast.error("Please save the draft first");
      return;
    }
    setSandboxOpen(true);
  };

  const handlePingEndpoint = async () => {
    if (!draftId) {
      toast.error("Please save the draft first");
      return;
    }
    
    if (form.integrationType === "n8n") {
       setSandboxOpen(true);
       return;
    }
    
    if (!form.endpointUrl) {
       toast.error("Please enter an endpoint URL in Step 2");
       return;
    }

    setLoading(true);
    const toastId = toast.loading("Running connection tests...");
    try {
      const res = await fetch(`/api/sellers/agents/${draftId}/test-endpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointUrl: form.endpointUrl })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error?.message || "Test failed");
      
      if (data.passed) {
        setTestResult({ passed: true, avgMs: data.avgMs, errorRate: data.errorRate });
        toast.success(`Test Passed! Avg latency: ${data.avgMs}ms`, { id: toastId });
      } else {
        setTestResult({ passed: false, errorRate: data.errorRate, message: "Endpoint failed to respond with valid protocol." });
        toast.error(`Test Failed! Error rate: ${data.errorRate * 100}%`, { id: toastId });
      }
    } catch (err: any) {
      setTestResult({ passed: false, message: err.message });
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!draftId) {
      toast.error("Please save the draft first");
      return;
    }
    
    setLoading(true);
    const toastId = toast.loading("Publishing to marketplace...");
    try {
      const res = await fetch(`/api/sellers/agents/${draftId}/publish`, { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error?.message || "Failed to publish");
      
      toast.success("Agent published successfully! It is now live.", { id: toastId });
      router.push("/dashboard/seller/listings");
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Studio Top Bar */}
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="px-4 md:px-6 py-3 md:py-0 min-h-[4rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/seller/listings")} className="text-muted-foreground hover:text-foreground shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-border shrink-0" />
            <h1 className="font-semibold text-lg flex items-center gap-2 shrink-0">
              <Bot className="h-5 w-5 text-primary" />
              Agent Details
            </h1>
            {draftId && (
              <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-700 text-xs font-medium border border-yellow-500/20 shrink-0">
                Draft (Staging)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" className="rounded-xl border-dashed flex-1 md:flex-none" onClick={handleSaveDraft} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" /> 
              Save
            </Button>
            <Button variant="ghost" className="rounded-xl flex-1 md:flex-none px-2 sm:px-4" onClick={() => router.push("/dashboard/seller/listings")}>
              <span className="hidden sm:inline">Close</span>
              <span className="sm:hidden">Close</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full p-6 lg:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="flex sm:grid sm:grid-cols-4 w-full bg-background border rounded-2xl h-auto sm:h-14 p-1 shadow-sm overflow-x-auto scrollbar-hide justify-start">
            <TabsTrigger value="basics" className="shrink-0 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none font-medium px-4 py-2 sm:py-0 sm:px-2">1. Basics</TabsTrigger>
            <TabsTrigger value="setup" disabled={!draftId} className="shrink-0 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none font-medium px-4 py-2 sm:py-0 sm:px-2">2. Agent Setup</TabsTrigger>
            <TabsTrigger value="monetization" disabled={!draftId} className="shrink-0 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none font-medium px-4 py-2 sm:py-0 sm:px-2">3. Monetization</TabsTrigger>
            <TabsTrigger value="staging" disabled={!draftId} className="shrink-0 rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none font-medium px-4 py-2 sm:py-0 sm:px-2">4. Live Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-6">
            <div className="bg-background rounded-3xl border shadow-[var(--shadow-card)] p-8">
              <h2 className="text-xl font-bold mb-6 font-display">Define Your Agent</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Agent Name</Label>
                  <Input placeholder="e.g. Acme Support Bot" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 bg-gray-50/50" />
                </div>
                <div className="space-y-2">
                  <Label>Tag / Category</Label>
                  <Input placeholder="e.g. Sales, Coding" value={form.tag} onChange={e => setForm({...form, tag: e.target.value})} className="h-12 bg-gray-50/50" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Short Description</Label>
                  <Textarea placeholder="What does this agent do?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-gray-50/50 resize-none" rows={2} />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label>Detailed Description</Label>
                  <Textarea placeholder="Explain your agent in detail (minimum 150 words)..." value={form.longDesc} onChange={e => setForm({...form, longDesc: e.target.value})} className="bg-gray-50/50 resize-none" rows={6} />
                  <p className={`text-xs ${form.longDesc.trim().split(/\s+/).filter(w => w.length > 0).length < 150 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {form.longDesc.trim().split(/\s+/).filter((w) => w.length > 0).length} words (minimum 150)
                  </p>
                </div>
                
                <div className="md:col-span-2 mt-4">
                  <Label className="text-base">Integration Method</Label>
                  <p className="text-sm text-muted-foreground mb-4">How is your agent built?</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setForm({...form, integrationType: "n8n"})}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${form.integrationType === "n8n" ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:border-gray-300'}`}
                    >
                      <h3 className={`font-semibold flex items-center gap-2 ${form.integrationType === "n8n" ? 'text-primary' : 'text-gray-900'}`}>
                        <FileText className="h-4 w-4" /> n8n Workflow
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2">Upload your n8n workflow JSON file.</p>
                    </div>
                    <div 
                      onClick={() => setForm({...form, integrationType: "api"})}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${form.integrationType === "api" ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:border-gray-300'}`}
                    >
                      <h3 className={`font-semibold flex items-center gap-2 ${form.integrationType === "api" ? 'text-primary' : 'text-gray-900'}`}>
                        <LinkIcon className="h-4 w-4" /> API Endpoint
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2">Connect your existing backend API webhook.</p>
                    </div>
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveDraft} className="mt-8 rounded-xl h-12 w-full md:w-auto px-8" disabled={!form.name || loading}>
                Create Draft & Continue
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="setup" className="space-y-6">
            <div className="bg-background rounded-3xl border shadow-[var(--shadow-card)] p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  {form.integrationType === "n8n" ? <FileText className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
                </div>
                <h2 className="text-xl font-bold font-display">Agent Setup</h2>
              </div>
              
              {form.integrationType === "n8n" ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm mb-6 max-w-2xl">
                    Upload your n8n workflow JSON file or paste the JSON directly. Our platform will automatically parse and deploy it in our preview environment.
                  </p>

                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="upload" className="rounded-lg">Upload File</TabsTrigger>
                      <TabsTrigger value="paste" className="rounded-lg">Paste JSON</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload">
                      <Label htmlFor="workflow-upload" className="block mt-2">
                        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group relative">
                          <input 
                            id="workflow-upload" 
                            type="file" 
                            accept=".json" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            disabled={uploadingFile}
                          />
                          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-border group-hover:scale-105 transition-transform">
                            {form.assetKey && !form.assetKey.includes('pasted-') ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <UploadCloud className="h-6 w-6 text-primary" />}
                          </div>
                          <h3 className="font-semibold text-gray-900 mt-4">
                            {uploadingFile ? "Uploading..." : (form.assetKey && !form.assetKey.includes('pasted-')) ? "File Uploaded Successfully!" : "Drag and drop JSON file here"}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">Supports n8n exported .json workflows</p>
                          <Button type="button" variant="outline" className="mt-6 rounded-xl bg-white shadow-sm pointer-events-none" disabled={uploadingFile}>
                            {uploadingFile ? "Uploading..." : (form.assetKey && !form.assetKey.includes('pasted-')) ? "Replace File" : "Browse Files"}
                          </Button>
                        </div>
                      </Label>
                    </TabsContent>
                    <TabsContent value="paste">
                      <div className="space-y-4 mt-2">
                        <Textarea 
                          placeholder="Paste your n8n workflow JSON here..." 
                          className="min-h-[250px] font-mono text-xs bg-gray-50/50 border-gray-300 rounded-xl p-4"
                          value={pastedJson}
                          onChange={(e) => {
                            setPastedJson(e.target.value);
                            setJsonError("");
                          }}
                        />
                        <div className="flex items-center justify-between">
                          <div>
                            {form.workflowData && form.assetKey?.includes('pasted-') && (
                              <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                                <CheckCircle2 className="h-4 w-4" /> Valid JSON processed and loaded
                              </p>
                            )}
                            {jsonError && (
                              <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="h-4 w-4" /> {jsonError}
                              </p>
                            )}
                          </div>
                          <Button 
                            type="button" 
                            onClick={handleProcessPastedJson} 
                            disabled={!pastedJson.trim() || uploadingFile}
                            className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            {uploadingFile ? "Processing..." : "Apply & Validate"}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm mb-6 max-w-2xl">
                    Provide your backend API endpoint. We will route buyer requests to this webhook.
                  </p>
                  
                  <div className="space-y-2 max-w-xl">
                    <Label>Endpoint URL</Label>
                    <Input 
                      placeholder="https://api.yourdomain.com/v1/agent" 
                      value={form.endpointUrl} 
                      onChange={e => setForm({...form, endpointUrl: e.target.value})} 
                      className="h-12 bg-gray-50/50" 
                    />
                    <p className="text-xs text-muted-foreground mt-2">Must be a publicly accessible HTTPS URL.</p>
                  </div>
                </>
              )}

              <div className="mt-8 flex justify-end">
                <Button onClick={() => setActiveTab("monetization")} className="rounded-xl h-12 px-8" disabled={uploadingFile || (form.integrationType === "n8n" && !form.assetKey) || (form.integrationType === "api" && !form.endpointUrl)}>Save & Continue</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monetization" className="space-y-6">
            <div className="bg-background rounded-3xl border shadow-[var(--shadow-card)] p-8">
              <h2 className="text-xl font-bold mb-6 font-display">Pricing Architecture</h2>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {[
                  { id: "subscription", title: "Flat Subscription", desc: "Charge a fixed monthly fee." },
                  { id: "usage_based", title: "Usage Based", desc: "Charge per prompt or token." },
                  { id: "outcome_based", title: "Outcome Escrow", desc: "Charge only on successful tasks." }
                ].map(model => (
                  <div key={model.id} 
                    onClick={() => setForm({...form, pricingModel: model.id})}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${form.pricingModel === model.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:border-gray-300'}`}
                  >
                    <h3 className={`font-semibold ${form.pricingModel === model.id ? 'text-primary' : 'text-gray-900'}`}>{model.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{model.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 max-w-sm">
                <Label>Base Price (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                  <Input value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="pl-7 h-12 bg-gray-50/50 text-lg font-medium" placeholder="49.00" />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <Button onClick={() => setActiveTab("staging")} className="rounded-xl h-12 px-8">Save & Continue</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="staging" className="space-y-6">
            <div className="bg-background rounded-3xl border shadow-[var(--shadow-card)] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><ShieldCheck className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-xl font-bold font-display">Live Preview</h2>
                  <p className="text-sm text-muted-foreground">Test your agent securely before submitting for review.</p>
                </div>
              </div>

              {form.integrationType === "api" ? (
                <>
                  {secret && (
                    <div className="mb-8 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col gap-2">
                      <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2"><Key className="h-3 w-3" /> SDK Verification Secret</span>
                      <code className="text-sm bg-white border px-3 py-2 rounded-lg text-blue-900">{secret}</code>
                      <p className="text-xs text-blue-600">Include this in your backend headers to authenticate incoming staging requests.</p>
                    </div>
                  )}

                  <div className="border border-border rounded-2xl bg-gray-50/50 flex flex-col items-center justify-center text-center p-8">
                    <Play className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="font-semibold text-gray-900">Connection Verification</h3>
                    <p className="text-sm text-gray-500 max-w-md mt-2">
                      We will send 5 sequential ping requests to <code>{form.endpointUrl || "your endpoint"}</code>. 
                      Ensure your server is running and validates the <code>X-AIGenius-Signature</code> header using the secret above.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <Button onClick={handlePingEndpoint} disabled={loading || !form.endpointUrl} variant="outline" className="rounded-xl px-6 shadow-sm border-gray-300">
                        {loading ? "Running tests..." : "Run Connection Test"}
                      </Button>
                      <Button onClick={handlePublish} disabled={loading || !draftId} className="rounded-xl px-8 shadow-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white transition-all hover:scale-[1.02]">
                        <Rocket className="h-4 w-4 mr-2" /> Publish Now
                      </Button>
                    </div>
                    {!form.endpointUrl && <p className="text-xs text-amber-600 mt-3">Please provide an endpoint URL in Step 2.</p>}
                    
                    {testResult && (
                      <div className={`mt-6 w-full max-w-sm p-4 rounded-xl text-left border ${testResult.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`font-semibold flex items-center gap-2 ${testResult.passed ? 'text-emerald-700' : 'text-red-700'}`}>
                          {testResult.passed ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                          {testResult.passed ? "Test Passed Successfully" : "Connection Test Failed"}
                        </div>
                        {testResult.passed ? (
                          <div className="mt-2 text-sm text-emerald-600 space-y-1">
                            <p>✓ Avg Latency: {testResult.avgMs}ms</p>
                            <p>✓ Error Rate: {(testResult.errorRate || 0) * 100}%</p>
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-red-600 space-y-1">
                            <p>✗ {testResult.message || `Error Rate: ${((testResult.errorRate || 1) * 100).toFixed(0)}%`}</p>
                            <p className="text-xs mt-2 opacity-80">Make sure your endpoint responds with application/json or text/event-stream.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="border border-border rounded-2xl bg-gray-50/50 flex flex-col items-center justify-center text-center p-8">
                    <Bot className="h-12 w-12 text-primary mb-4" />
                    <h3 className="font-semibold text-gray-900">Interactive Preview</h3>
                    <p className="text-sm text-gray-500 max-w-md mt-2">
                      Your n8n workflow has been securely loaded. You can simulate requests to verify logic and tool execution before publishing.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <Button onClick={handleOpenSandbox} disabled={loading || !form.assetKey} variant="outline" className="rounded-xl px-6 shadow-sm border-gray-300">
                        {loading ? "Initializing..." : "Open Interactive Preview"}
                      </Button>
                      <Button onClick={handlePublish} disabled={loading || !draftId} className="rounded-xl px-8 shadow-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white transition-all hover:scale-[1.02]">
                        <Rocket className="h-4 w-4 mr-2" /> Publish Now
                      </Button>
                    </div>
                    {!form.assetKey && <p className="text-xs text-amber-600 mt-3">Please upload your workflow JSON in Step 2.</p>}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* Chat Sandbox Modal */}
      {sandboxOpen && draftId && (
        <StagingSandbox
          agentId={draftId}
          agentName={form.name || "Your Agent"}
          integrationType={form.integrationType as "n8n" | "api"}
          endpointUrl={form.endpointUrl}
          workflowData={form.workflowData}
          onClose={() => setSandboxOpen(false)}
        />
      )}
    </div>
  );
}
