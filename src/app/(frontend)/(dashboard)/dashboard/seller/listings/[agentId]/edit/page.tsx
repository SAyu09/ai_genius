"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { ArrowLeft, Bot, CheckCircle, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.agentId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    tag: "",
    description: "",
    category: "",
    price: "",
    longDesc: "",
    embedUrl: "",
  });

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await fetch(`/api/seller/agents/${agentId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch agent");
        
        const agent = data.agent;
        setForm({
          name: agent.name || "",
          tag: agent.tag || "",
          description: agent.description || "",
          category: agent.category || "",
          price: ((agent.monthlyPricePaise || 0) / 100).toString(),
          longDesc: agent.longDesc || "",
          embedUrl: agent.embedUrl || "",
        });
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (agentId) fetchAgent();
  }, [agentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/seller/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          monthlyPrice: parseFloat(form.price),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update agent");

      toast.success("Listing updated successfully!");
      router.push("/dashboard/seller/listings");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <h1 className="font-display text-3xl font-bold">Edit Agent Listing</h1>
          <p className="text-muted-foreground mt-2">Update your agent's details and pricing.</p>
        </div>

        <Card className="rounded-3xl border-none shadow-sm">
          <CardHeader className="bg-primary/5 border-b pb-6 px-8 rounded-t-3xl">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                 <Bot className="h-6 w-6" />
               </div>
               <div>
                 <CardTitle>Listing Details</CardTitle>
                 <CardDescription>Modify the information shown on the marketplace.</CardDescription>
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">{error}</div>}
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag">Tag</Label>
                  <Input id="tag" required value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="productivity">Productivity</option>
                    <option value="sales">Sales & Support</option>
                    <option value="development">Development</option>
                    <option value="content">Content Creation</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Price (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-muted-foreground">$</span>
                    <Input id="price" type="number" step="0.01" min="1" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="h-12 rounded-xl pl-8" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Input id="description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-12 rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longDesc">Detailed Description</Label>
                <Textarea id="longDesc" required value={form.longDesc} onChange={(e) => setForm({ ...form, longDesc: e.target.value })} className="min-h-[120px] rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="embedUrl">Embed / Website URL</Label>
                <Input id="embedUrl" type="url" required value={form.embedUrl} onChange={(e) => setForm({ ...form, embedUrl: e.target.value })} className="h-12 rounded-xl" />
                <p className="text-[10px] text-muted-foreground">Changing the URL will trigger a new performance verification test.</p>
              </div>

              <div className="pt-6 border-t flex justify-end gap-3">
                <Button type="button" variant="ghost" className="rounded-xl h-12 px-6" onClick={() => router.push("/dashboard/seller/listings")}>Cancel</Button>
                <Button type="submit" disabled={saving} className="rounded-xl h-12 px-8 shadow-lg gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
