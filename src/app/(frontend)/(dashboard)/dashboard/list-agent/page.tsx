"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { ArrowLeft, Bot, CheckCircle, Workflow, MessageSquare, FormInput, ExternalLink, AlertCircle, Key, Copy } from "lucide-react";
import Link from "next/link";

type AgentType = "chat" | "form" | "workflow";

// Helper to count words
const countWords = (str: string) => {
  return str.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export default function ListAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [agentType, setAgentType] = useState<AgentType>("chat");

  const [form, setForm] = useState({
    name: "",
    tag: "",
    description: "", // short desc
    longDesc: "", // professional detailed desc
    category: "",
    price: "",
    // Hosted specific
    endpointUrl: "",
    // Workflow specific
    workflowJson: "",
  });

  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const wordCount = countWords(form.longDesc);
  const minWords = 150;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (wordCount < minWords) {
      setError(`Your detailed description must be at least ${minWords} words long. You currently have ${wordCount} words.`);
      setLoading(false);
      return;
    }

    try {
      const priceCents = Math.round(parseFloat(form.price) * 100);
      if (isNaN(priceCents)) throw new Error("Please enter a valid price");

      const payload = {
        name: form.name,
        tag: form.tag,
        description: form.description,
        longDesc: agentType === "workflow" ? `${form.longDesc}\n\nWORKFLOW_JSON:${form.workflowJson}` : form.longDesc,
        category: form.category,
        monthlyPrice: form.price,
        type: agentType === "workflow" ? "workflow" : "hosted",
        agentType: agentType,
        endpointUrl: form.endpointUrl,
        features: [],
        useCases: [],
      };

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to list agent");

      setCreatedAgentId(data.agent.id);

      if (agentType !== "workflow") {
        try {
          const secRes = await fetch(`/api/sellers/agents/${data.agent.id}/regenerate-secret`, { method: "POST" });
          if (secRes.ok) {
             const secData = await secRes.json();
             setSecret(secData.secret);
          }
        } catch (e) {
          console.error("Failed to fetch secret immediately", e);
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md w-full text-center rounded-3xl border-none shadow-xl min-h-[400px] flex flex-col items-center justify-center p-8">
          <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-6 mx-auto">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold font-display mb-2">Listing Created!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your listing has been successfully created and submitted for review.
          </p>

          {agentType !== "workflow" && secret && (
            <div className="w-full bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 text-left mb-6">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <Key className="h-4 w-4 text-blue-600" />
                Your AIGenius_SECRET
              </h3>
              <p className="text-[11px] text-muted-foreground mb-3">
                Copy this SDK secret now. You will need it to verify requests in your backend. You can always view it later in the Developer & API docs.
              </p>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="h-10 text-xs font-mono bg-background rounded-xl text-green-700" />
                <Button size="icon" variant="outline" className="h-10 w-10 shrink-0 rounded-xl bg-background" onClick={() => {
                  navigator.clipboard.writeText(secret);
                  alert("Copied to clipboard!");
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 w-full mt-2">
            <Button onClick={() => router.push("/dashboard/seller/listings")} className="w-full rounded-xl h-12" size="lg">
              View My Listings
            </Button>
            {agentType !== "workflow" && (
              <Button variant="outline" onClick={() => router.push("/dashboard/seller/developer")} className="w-full rounded-xl h-12" size="lg">
                Go to Developer Integration Docs
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6 lg:p-12">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/dashboard/seller/listings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Listings
        </Link>
        
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">List a New Agent</h1>
          <p className="text-muted-foreground mt-2">Publish your AI agent to thousands of buyers worldwide.</p>
        </div>

        {/* Agent Type Selector */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <button
            type="button"
            onClick={() => { setAgentType("chat"); setError(""); }}
            className={`flex flex-col items-start gap-2 p-5 rounded-3xl border-2 text-left transition-all ${
              agentType === "chat" 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${agentType === "chat" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold font-display text-sm">Chat Agent</h3>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">Streaming chatbot using your backend API.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setAgentType("form"); setError(""); }}
            className={`flex flex-col items-start gap-2 p-5 rounded-3xl border-2 text-left transition-all ${
              agentType === "form" 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${agentType === "form" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <FormInput className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold font-display text-sm">Form / Tool</h3>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">Data-processing tools with schema-based inputs.</p>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => { setAgentType("workflow"); setError(""); }}
            className={`flex flex-col items-start gap-2 p-5 rounded-3xl border-2 text-left transition-all ${
              agentType === "workflow" 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${agentType === "workflow" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold font-display text-sm">n8n Workflow</h3>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">Upload n8n workflow. We handle hosting.</p>
            </div>
          </button>
        </div>

        <Card className="rounded-3xl border-none shadow-sm">
          <CardHeader className="bg-primary/5 border-b pb-6 px-8 rounded-t-3xl flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                 <Bot className="h-6 w-6" />
               </div>
               <div>
                 <CardTitle>Agent Configuration</CardTitle>
                 <CardDescription>Setup your agent and provide clear details for buyers.</CardDescription>
               </div>
            </div>
            <Link href="/docs/sdk-integration" target="_blank" className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-full">
              <ExternalLink className="h-3 w-3" /> Integration Docs
            </Link>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium flex items-center gap-3"><AlertCircle className="h-5 w-5 shrink-0" /> {error}</div>}
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name <span className="text-destructive">*</span></Label>
                  <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Apollo Sales Bot" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag">Tag <span className="text-destructive">*</span></Label>
                  <Input id="tag" required value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. Sales, Marketing, Code" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                  <select
                    id="category"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="" disabled>Select a category</option>
                    <option value="productivity">Productivity</option>
                    <option value="sales">Sales & Support</option>
                    <option value="development">Development</option>
                    <option value="content">Content Creation</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Price (USD) <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-muted-foreground">$</span>
                    <Input id="price" type="number" step="0.01" min="1" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="49.00" className="h-12 rounded-xl pl-8" />
                  </div>
                </div>
              </div>

              {agentType !== "workflow" && (
                <div className="space-y-2 bg-muted/30 p-5 rounded-2xl border border-border">
                  <Label htmlFor="endpointUrl" className="flex items-center justify-between">
                    <span>Backend SDK Endpoint URL <span className="text-destructive">*</span></span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    The URL on your server where our platform will securely route requests to your agent. Your backend must implement the <code>@aigenius/sdk</code> to handle HMAC verification.
                  </p>
                  <Input id="endpointUrl" type="url" required value={form.endpointUrl} onChange={(e) => setForm({ ...form, endpointUrl: e.target.value })} placeholder="https://api.yourdomain.com/webhook/ai-genius" className="h-12 rounded-xl" />
                </div>
              )}

              {agentType === "workflow" && (
                <div className="space-y-2">
                  <Label htmlFor="workflowJson">n8n Workflow JSON <span className="text-destructive">*</span></Label>
                  <Textarea id="workflowJson" required value={form.workflowJson} onChange={(e) => setForm({ ...form, workflowJson: e.target.value })} placeholder="Paste your exported n8n workflow JSON here..." className="min-h-[120px] rounded-xl resize-none p-4 font-mono text-xs" />
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="description">Short Description (Punchline) <span className="text-destructive">*</span></Label>
                  <Input id="description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A one-sentence pitch for your agent." className="h-12 rounded-xl" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="longDesc">Detailed Description <span className="text-destructive">*</span></Label>
                    <span className={`text-xs font-semibold ${wordCount < minWords ? "text-destructive" : "text-green-600"}`}>
                      {wordCount} / {minWords} words minimum
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    Provide a highly professional, detailed description of your agent. Explain the core features, the problem it solves, use-cases, and any setup requirements for the buyer. This ensures quality across the marketplace.
                  </p>
                  <Textarea 
                    id="longDesc" 
                    required 
                    value={form.longDesc} 
                    onChange={(e) => setForm({ ...form, longDesc: e.target.value })} 
                    placeholder="Write a comprehensive guide and pitch for your agent..." 
                    className={`min-h-[200px] rounded-xl p-4 ${wordCount > 0 && wordCount < minWords ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                </div>
              </div>

              <div className="pt-6 border-t flex justify-end gap-3">
                <Button type="button" variant="ghost" className="rounded-xl h-12 px-6" onClick={() => router.push("/dashboard/seller/listings")}>Cancel</Button>
                <Button type="submit" disabled={loading} className="rounded-xl h-12 px-8 shadow-lg">
                  {loading ? "Saving..." : "Create Listing"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
