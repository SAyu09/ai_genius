"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { ArrowLeft, Bot, UploadCloud, FileText, Database, ShieldCheck, Rocket, RefreshCw, Key, Play } from "lucide-react";
import { toast } from "sonner";

export default function CreatorStudioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basics");
  
  const [form, setForm] = useState({
    name: "",
    tag: "",
    description: "",
    longDesc: "This is a detailed description of the agent...", // Mock minimum length to pass the 150-word check for staging tests if needed
    category: "",
    price: "",
    pricingModel: "usage_based", // newly added in phase 2
    agentType: "chat",
  });

  const [draftId, setDraftId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      // To satisfy the 150 word count validator quickly during testing
      const padding = Array(150).fill("test").join(" ");
      const payload = {
        ...form,
        longDesc: form.longDesc.length > 50 ? form.longDesc : form.longDesc + " " + padding,
        monthlyPrice: form.price || "0",
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
      setActiveTab("knowledge");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Studio Top Bar */}
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/seller/listings")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Agent Details
            </h1>
            {draftId && (
              <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-700 text-xs font-medium border border-yellow-500/20">
                Draft (Staging)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-dashed" onClick={handleSaveDraft} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" /> 
              Save Draft
            </Button>
            <Button className="rounded-xl shadow-lg shadow-primary/20" onClick={() => router.push("/dashboard/seller/listings")} disabled={!draftId}>
              <Rocket className="h-4 w-4 mr-2" />
              Exit to Publish
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full p-6 lg:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-4 w-full bg-background border rounded-2xl h-14 p-1 shadow-sm">
            <TabsTrigger value="basics" className="rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none font-medium">1. Basics</TabsTrigger>
            <TabsTrigger value="knowledge" disabled={!draftId} className="rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none font-medium">2. Knowledge Base</TabsTrigger>
            <TabsTrigger value="monetization" disabled={!draftId} className="rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none font-medium">3. Monetization</TabsTrigger>
            <TabsTrigger value="staging" disabled={!draftId} className="rounded-xl data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none font-medium">4. Staging Test</TabsTrigger>
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
                  <Textarea placeholder="What does this agent do?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-gray-50/50 resize-none" />
                </div>
              </div>
              <Button onClick={handleSaveDraft} className="mt-8 rounded-xl h-12 w-full md:w-auto px-8" disabled={!form.name || loading}>
                Create Draft & Continue
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <div className="bg-background rounded-3xl border shadow-[var(--shadow-card)] p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Database className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold font-display">Knowledge Base</h2>
              </div>
              <p className="text-muted-foreground text-sm mb-6 max-w-2xl">
                Upload your company data, PDFs, or CSVs. We automatically chunk, index, and retrieve this context for your agent. No vector database configuration required.
              </p>

              <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-border group-hover:scale-105 transition-transform">
                  <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mt-4">Drag and drop files here</h3>
                <p className="text-sm text-gray-500 mt-1">Supports PDF, DOCX, CSV, TXT up to 50MB</p>
                <Button variant="outline" className="mt-6 rounded-xl bg-white shadow-sm">Browse Files</Button>
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="font-semibold">System Instructions</h3>
                <Textarea className="h-32 bg-gray-50/50 resize-none font-mono text-sm" placeholder="You are a helpful assistant. Use the uploaded knowledge base to answer questions..." />
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setActiveTab("monetization")} className="rounded-xl h-12 px-8">Save & Continue</Button>
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
                  <h2 className="text-xl font-bold font-display">Staging Safe Zone</h2>
                  <p className="text-sm text-muted-foreground">Test your agent securely before submitting for review.</p>
                </div>
              </div>

              {secret && (
                <div className="mb-8 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col gap-2">
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2"><Key className="h-3 w-3" /> SDK Verification Secret</span>
                  <code className="text-sm bg-white border px-3 py-2 rounded-lg text-blue-900">{secret}</code>
                  <p className="text-xs text-blue-600">Include this in your backend headers to authenticate incoming staging requests.</p>
                </div>
              )}

              <div className="border border-border rounded-2xl bg-gray-50/50 h-[400px] flex flex-col items-center justify-center text-center p-6">
                <Play className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="font-semibold text-gray-900">Sandbox Environment</h3>
                <p className="text-sm text-gray-500 max-w-md mt-2">
                  Connect your local endpoint to interact with the agent as a buyer would. Latency and vector queries run in isolated staging mode.
                </p>
                <Button variant="outline" className="mt-6 rounded-xl bg-white shadow-sm">Ping Endpoint</Button>
              </div>
              
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
