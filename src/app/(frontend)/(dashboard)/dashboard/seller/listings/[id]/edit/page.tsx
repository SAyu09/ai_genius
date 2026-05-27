"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AgentData {
  id: string;
  name: string;
  tag: string;
  description: string;
  longDesc: string;
  monthlyPrice: number;
  endpointUrl: string;
}

export default function EditAgentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const agentId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");

  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        if (!res.ok) {
          toast.error("Failed to load agent data");
          return;
        }
        const data = await res.json();
        const agent = data.agent as AgentData;
        setName(agent.name || "");
        setTag(agent.tag || "");
        setDescription(agent.description || "");
        setLongDesc(agent.longDesc || "");
        setMonthlyPrice(agent.monthlyPrice?.toString() || "");
        setEndpointUrl(agent.endpointUrl || "");
      } catch {
        toast.error("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchAgent();
  }, [agentId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tag,
          description,
          longDesc,
          monthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : undefined,
          endpointUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Agent updated successfully!");
        router.push("/dashboard/seller/listings");
      } else {
        toast.error(data.error || "Failed to update agent");
      }
    } catch {
      toast.error("Failed to connect to server");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-600"
          onClick={() => router.push("/dashboard/seller/listings")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Agent</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Update your agent&apos;s details below.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Agent name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tag">Tag</Label>
          <Input
            id="tag"
            value={tag}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTag(e.target.value)}
            placeholder="e.g. productivity, ai-assistant"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Short Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Brief description of your agent"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longDesc">Detailed Description</Label>
          <Textarea
            id="longDesc"
            value={longDesc}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLongDesc(e.target.value)}
            placeholder="Detailed description (minimum 150 words)"
            rows={8}
          />
          <p className="text-xs text-gray-400">
            {longDesc.trim().split(/\s+/).filter((w) => w.length > 0).length} words (minimum 150)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="price">Monthly Price (₹)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={monthlyPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMonthlyPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpointUrl">Endpoint URL</Label>
            <Input
              id="endpointUrl"
              value={endpointUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndpointUrl(e.target.value)}
              placeholder="https://your-api.example.com/agent"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/seller/listings")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
