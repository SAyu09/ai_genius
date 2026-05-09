"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { ArrowLeft, Bot, CheckCircle, Workflow, Globe, Code, FileJson, AlertCircle } from "lucide-react";
import Link from "next/link";

type AgentType = "workflow" | "hosted";

export default function ListAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [agentType, setAgentType] = useState<AgentType>("workflow");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<"none" | "pass" | "fail">("none");

  const [form, setForm] = useState({
    name: "",
    tag: "",
    description: "",
    category: "",
    price: "",
    // Type 1 specific
    workflowJson: "",
    agentDetails: "",
    // Type 2 specific
    websiteUrl: "",
  });

  const handleVerify = async () => {
    setVerifying(true);
    setVerificationResult("none");
    // Mock SDK verification and performance test
    setTimeout(() => {
      setVerifying(false);
      // Mock result (random pass/fail for demo purposes)
      setVerificationResult(Math.random() > 0.3 ? "pass" : "fail");
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (agentType === "hosted" && verificationResult !== "pass") {
      setError("You must pass the SDK and performance verification before listing.");
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
        longDesc: agentType === "workflow" ? form.agentDetails : "Website Agent",
        category: form.category,
        monthlyPrice: form.price,
        type: agentType,
        embedUrl: agentType === "hosted" ? form.websiteUrl : "",
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
        <Card className="max-w-md text-center rounded-3xl border-none shadow-xl min-h-[400px] flex flex-col items-center justify-center p-8">
          <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-6 mx-auto">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold font-display mb-2">Listing Submitted!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your AI Agent has been successfully submitted for review. Once approved, it will be live on the marketplace!
          </p>
          <Button onClick={() => router.push("/dashboard/seller/listings")} className="w-full rounded-xl" size="lg">
            View My Listings
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6 lg:p-12">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/dashboard/seller/listings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Listings
        </Link>
        
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">List a New Agent</h1>
          <p className="text-muted-foreground mt-2">Publish your AI agent to thousands of buyers worldwide.</p>
        </div>

        {/* Agent Type Selector */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <button
            type="button"
            onClick={() => { setAgentType("workflow"); setError(""); }}
            className={`flex flex-col items-start gap-2 p-6 rounded-3xl border-2 text-left transition-all ${
              agentType === "workflow" 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${agentType === "workflow" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold font-display">n8n Workflow Agent</h3>
              <p className="text-xs text-muted-foreground mt-1">Upload your n8n workflow JSON. We handle the hosting and execution.</p>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => { setAgentType("hosted"); setError(""); }}
            className={`flex flex-col items-start gap-2 p-6 rounded-3xl border-2 text-left transition-all ${
              agentType === "hosted" 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${agentType === "hosted" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold font-display">Website Agent</h3>
              <p className="text-xs text-muted-foreground mt-1">Integrate our SDK into your own hosted site to sell access.</p>
            </div>
          </button>
        </div>

        <Card className="rounded-3xl border-none shadow-sm">
          <CardHeader className="bg-primary/5 border-b pb-6 px-8 rounded-t-3xl">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                 <Bot className="h-6 w-6" />
               </div>
               <div>
                 <CardTitle>{agentType === "workflow" ? "Workflow Details" : "Website Details"}</CardTitle>
                 <CardDescription>Provide clear value to help buyers understand your agent.</CardDescription>
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">{error}</div>}
              
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
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>Select a category</option>
                    <option value="productivity">Productivity</option>
                    <option value="sales">Sales & Support</option>
                    <option value="development">Development</option>
                    <option value="content">Content Creation</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Short Description <span className="text-destructive">*</span></Label>
                  <Input id="description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A one-sentence pitch for your agent." className="h-12 rounded-xl" />
                </div>
              </div>

              {agentType === "workflow" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="workflowJson">n8n Workflow JSON <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <FileJson className="absolute left-4 top-4 text-muted-foreground h-5 w-5" />
                      <Textarea id="workflowJson" required value={form.workflowJson} onChange={(e) => setForm({ ...form, workflowJson: e.target.value })} placeholder="Paste your exported n8n workflow JSON here..." className="min-h-[120px] rounded-xl resize-none pl-12 pt-4 font-mono text-xs" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agentDetails">Agent Details & Credentials Required <span className="text-destructive">*</span></Label>
                    <Textarea id="agentDetails" required value={form.agentDetails} onChange={(e) => setForm({ ...form, agentDetails: e.target.value })} placeholder="Explain what the agent does and list any API keys the buyer needs to provide..." className="min-h-[100px] rounded-xl resize-none p-4" />
                  </div>
                </>
              )}

              {agentType === "hosted" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL <span className="text-destructive">*</span></Label>
                    <Input id="websiteUrl" type="url" required value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://your-agent-app.com" className="h-12 rounded-xl" />
                  </div>

                  {/* SDK Instructions */}
                  <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
                    <div className="bg-muted px-4 py-3 border-b flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      <h4 className="font-semibold text-sm">SDK Integration Instructions</h4>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-3">
                        Add this script to your website's <code className="bg-muted px-1 rounded">&lt;head&gt;</code> to enable seamless marketplace embedding and user authentication.
                      </p>
                      <pre className="bg-[#0D1117] text-gray-300 p-4 rounded-lg text-[11px] overflow-x-auto">
                        {`<script src="https://sellget.ai/sdk.js"></script>\n<script>\n  window.SellGet.init({\n    agentId: "WILL_BE_GENERATED",\n    theme: "light"\n  });\n</script>`}
                      </pre>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="rounded-xl border border-border p-5 bg-card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-sm">SDK & Performance Verification</h4>
                        <p className="text-xs text-muted-foreground mt-1">We will verify the SDK installation and test server performance.</p>
                      </div>
                      <Button type="button" onClick={handleVerify} disabled={verifying || !form.websiteUrl} className="rounded-lg shadow-sm">
                        {verifying ? "Verifying..." : "Verify Integration"}
                      </Button>
                    </div>

                    {verificationResult === "pass" && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 text-green-700 border border-green-500/20">
                        <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-sm font-bold">Verification Passed</h5>
                          <p className="text-xs mt-1 opacity-90">SDK detected. Performance test: Avg 450ms, P95 800ms. Server meets requirements.</p>
                        </div>
                      </div>
                    )}

                    {verificationResult === "fail" && (
                      <div className="flex flex-col gap-3 p-4 rounded-lg bg-red-500/10 text-red-700 border border-red-500/20">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-sm font-bold">Performance Test Failed</h5>
                            <p className="text-xs mt-1 opacity-90">SDK detected, but server response time is below threshold (Avg 1200ms, P95 2500ms). Maximum allowed is 800ms Avg.</p>
                          </div>
                        </div>
                        <div className="ml-8 p-3 rounded-md bg-background border border-red-200">
                          <p className="text-xs font-semibold text-foreground mb-2">Options:</p>
                          <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-1">
                            <li>Optimize your server and re-test.</li>
                            <li>Host on our platform for ₹500/mo (guaranteed &lt; 2s load time).</li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="price">Monthly Price (USD) <span className="text-destructive">*</span></Label>
                <div className="relative max-w-sm">
                  <span className="absolute left-4 top-3.5 text-muted-foreground">$</span>
                  <Input id="price" type="number" step="0.01" min="1" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="49.00" className="h-12 rounded-xl pl-8" />
                </div>
              </div>

              <div className="pt-6 border-t flex justify-end gap-3">
                <Button type="button" variant="ghost" className="rounded-xl h-12 px-6" onClick={() => router.push("/dashboard/seller/listings")}>Cancel</Button>
                <Button type="submit" disabled={loading || (agentType === "hosted" && verificationResult !== "pass")} className="rounded-xl h-12 px-8 shadow-lg">
                  {loading ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
