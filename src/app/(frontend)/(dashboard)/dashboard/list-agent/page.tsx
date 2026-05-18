"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { ArrowLeft, Bot, CheckCircle, CheckCircle2, Workflow, MessageSquare, LayoutTemplate, ExternalLink, AlertCircle, Key, Copy, Info } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-border rounded-xl shadow-sm text-center flex flex-col items-center justify-center p-8">
          <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-6 mx-auto">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Listing Created!</h2>
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
            <Button onClick={() => router.push("/dashboard/seller/listings")} className="w-full h-10" size="lg">
              View My Listings
            </Button>
            {agentType !== "workflow" && (
              <Button variant="outline" onClick={() => router.push("/dashboard/seller/developer")} className="w-full h-10" size="lg">
                Integration Docs
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[760px]">
        <Link href="/dashboard/seller/listings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Listings
        </Link>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">List a New Agent</h1>
          <p className="text-sm text-gray-500 mt-1">Publish your AI agent to thousands of buyers worldwide.</p>
        </div>

        {/* Agent Type Selector */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <button
            type="button"
            onClick={() => { setAgentType("chat"); setError(""); }}
            className={`relative flex flex-col items-start p-5 rounded-xl text-left transition-all duration-200 ${
              agentType === "chat" 
                ? "border-2 border-primary bg-primary-subtle" 
                : "border border-border bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-xs cursor-pointer"
            }`}
          >
            {agentType === "chat" && <CheckCircle2 className="absolute top-4 right-4 h-4 w-4 text-primary" />}
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${agentType === "chat" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className={`font-semibold text-base mt-3 ${agentType === "chat" ? "text-primary" : "text-gray-800"}`}>Chat Agent</h3>
            <p className="text-sm text-gray-500 mt-1 leading-snug">Streaming chatbot using your backend API.</p>
          </button>

          <button
            type="button"
            onClick={() => { setAgentType("form"); setError(""); }}
            className={`relative flex flex-col items-start p-5 rounded-xl text-left transition-all duration-200 ${
              agentType === "form" 
                ? "border-2 border-primary bg-primary-subtle" 
                : "border border-border bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-xs cursor-pointer"
            }`}
          >
            {agentType === "form" && <CheckCircle2 className="absolute top-4 right-4 h-4 w-4 text-primary" />}
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${agentType === "form" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <h3 className={`font-semibold text-base mt-3 ${agentType === "form" ? "text-primary" : "text-gray-800"}`}>Form / Tool</h3>
            <p className="text-sm text-gray-500 mt-1 leading-snug">Data-processing tools with schema-based inputs.</p>
          </button>
          
          <button
            type="button"
            onClick={() => { setAgentType("workflow"); setError(""); }}
            className={`relative flex flex-col items-start p-5 rounded-xl text-left transition-all duration-200 ${
              agentType === "workflow" 
                ? "border-2 border-primary bg-primary-subtle" 
                : "border border-border bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-xs cursor-pointer"
            }`}
          >
            {agentType === "workflow" && <CheckCircle2 className="absolute top-4 right-4 h-4 w-4 text-primary" />}
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${agentType === "workflow" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
              <Workflow className="h-5 w-5" />
            </div>
            <h3 className={`font-semibold text-base mt-3 ${agentType === "workflow" ? "text-primary" : "text-gray-800"}`}>n8n Workflow</h3>
            <p className="text-sm text-gray-500 mt-1 leading-snug">Upload n8n workflow. We handle hosting.</p>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="mb-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium flex items-center gap-3"><AlertCircle className="h-5 w-5 shrink-0" /> {error}</div>}
          
          {/* SECTION 1: Agent Configuration */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary-subtle flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Agent Configuration</h2>
                  <p className="text-sm text-gray-500">Setup your agent and provide clear details for buyers.</p>
                </div>
              </div>
              {agentType !== "workflow" && (
                <Link href="/dashboard/seller/developer" target="_blank" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors">
                  <ExternalLink className="h-3 w-3 text-gray-500" /> Integration Docs
                </Link>
              )}
            </div>
            <div className="border-t border-gray-100 my-4" />
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name <span className="text-destructive">*</span></Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Apollo Sales Bot" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag">Tag <span className="text-destructive">*</span></Label>
                <Input id="tag" required value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. Sales, Marketing, Code" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                <select
                  id="category"
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/15 focus-visible:border-primary"
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
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input id="price" type="number" step="0.01" min="1" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="49.00" className="pl-7" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Integration */}
          {agentType !== "workflow" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary-subtle flex items-center justify-center">
                  <Key className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Integration</h2>
                  <p className="text-sm text-gray-500">Configure connection to your backend server.</p>
                </div>
              </div>
              <div className="border-t border-gray-100 my-4" />
              
              <div className="space-y-3">
                <Label htmlFor="endpointUrl">Backend SDK Endpoint URL <span className="text-destructive">*</span></Label>
                <Input id="endpointUrl" type="url" required value={form.endpointUrl} onChange={(e) => setForm({ ...form, endpointUrl: e.target.value })} placeholder="https://api.yourdomain.com/webhook/ai-genius" />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 mt-3">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium">Your backend must implement @aigenius/sdk for HMAC verification</p>
                    <Link href="/dashboard/seller/developer" className="text-sm text-blue-600 hover:underline mt-0.5 inline-block font-medium">
                      View Integration Docs →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Description & Media */}
          {agentType === "workflow" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary-subtle flex items-center justify-center">
                  <Workflow className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Workflow JSON</h2>
                  <p className="text-sm text-gray-500">Provide the exported n8n workflow.</p>
                </div>
              </div>
              <div className="border-t border-gray-100 my-4" />
              <div className="space-y-2">
                <Label htmlFor="workflowJson">n8n Workflow JSON <span className="text-destructive">*</span></Label>
                <Textarea id="workflowJson" required value={form.workflowJson} onChange={(e) => setForm({ ...form, workflowJson: e.target.value })} placeholder="Paste your exported n8n workflow JSON here..." className="min-h-[120px] resize-none font-mono text-xs" />
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary-subtle flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Description & Media</h2>
                <p className="text-sm text-gray-500">How your agent will appear in the marketplace.</p>
              </div>
            </div>
            <div className="border-t border-gray-100 my-4" />
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description">Short Description (Punchline) <span className="text-destructive">*</span></Label>
                <Input id="description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A one-sentence pitch for your agent." />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="longDesc">Detailed Description <span className="text-destructive">*</span></Label>
                  <span className={`text-xs font-semibold ${wordCount < minWords ? "text-destructive" : "text-green-600"}`}>
                    {wordCount} / {minWords} words minimum
                  </span>
                </div>
                <Textarea 
                  id="longDesc" 
                  required 
                  value={form.longDesc} 
                  onChange={(e) => setForm({ ...form, longDesc: e.target.value })} 
                  placeholder="Write a comprehensive guide and pitch for your agent..." 
                  className={`min-h-[200px] ${wordCount > 0 && wordCount < minWords ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col items-end">
            <Button type="submit" size="xl" disabled={loading} className="w-full sm:w-auto min-w-[200px]">
              {loading ? "Publishing..." : "Publish Agent →"}
            </Button>
            <p className="text-xs text-gray-400 text-center sm:text-right mt-3 w-full sm:w-auto">
              Your agent will be reviewed within 1–2 business days
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
