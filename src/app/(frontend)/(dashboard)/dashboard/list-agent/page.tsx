"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { ArrowLeft, Upload, Bot, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ListAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    tag: "",
    description: "",
    longDesc: "",
    price: "",
    category: "",
    embedUrl: "",
    features: "",
    useCases: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate inputs
      const priceCents = Math.round(parseFloat(form.price) * 100);
      if (isNaN(priceCents)) throw new Error("Please enter a valid price");

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: priceCents,
          features: form.features.split(',').map(s => s.trim()),
          useCases: form.useCases.split(',').map(s => s.trim()),
        }),
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
          <Button onClick={() => router.push("/dashboard")} className="w-full rounded-xl" size="lg">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6 lg:p-12">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">List a New Agent</h1>
          <p className="text-muted-foreground mt-2">Publish your AI agent to thousands of buyers worldwide.</p>
        </div>

        <Card className="rounded-3xl border-none shadow-sm">
          <CardHeader className="bg-primary/5 border-b pb-6 px-8 rounded-t-3xl">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                 <Bot className="h-6 w-6" />
               </div>
               <div>
                 <CardTitle>Agent Details</CardTitle>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description <span className="text-destructive">*</span></Label>
                <Input id="description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A one-sentence pitch for your agent." className="h-12 rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longDesc">Detailed Description</Label>
                <Textarea id="longDesc" required value={form.longDesc} onChange={(e) => setForm({ ...form, longDesc: e.target.value })} placeholder="Explain how it works, what it connects to, and why they need it..." className="min-h-[120px] rounded-xl resize-none p-4" />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="features">Key Features (comma separated)</Label>
                  <Input id="features" required value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Auto-reply, CRM Sync, Lead Scoring" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="useCases">Use Cases (comma separated)</Label>
                  <Input id="useCases" required value={form.useCases} onChange={(e) => setForm({ ...form, useCases: e.target.value })} placeholder="B2B Sales, Real Estate, Support" className="h-12 rounded-xl" />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Price (USD) <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-muted-foreground">$</span>
                    <Input id="price" type="number" step="0.01" min="1" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="49.00" className="h-12 rounded-xl pl-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="embedUrl">Embed URL <span className="text-destructive">*</span></Label>
                  <Input id="embedUrl" type="url" required value={form.embedUrl} onChange={(e) => setForm({ ...form, embedUrl: e.target.value })} placeholder="https://your-agent-app.com/embed" className="h-12 rounded-xl" />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-xl flex gap-4 items-center">
                 <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                 </div>
                 <div className="flex-1">
                    <h4 className="text-sm font-semibold">Upload Asset (Mocked)</h4>
                    <p className="text-xs text-muted-foreground">For this demo, the asset upload is bypassed.</p>
                 </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <Button type="button" variant="ghost" className="rounded-xl h-12 px-6" onClick={() => router.push("/dashboard")}>Cancel</Button>
                <Button type="submit" disabled={loading} className="rounded-xl h-12 px-8 shadow-lg">
                  {loading ? "Submitting..." : "Publish Agent"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
