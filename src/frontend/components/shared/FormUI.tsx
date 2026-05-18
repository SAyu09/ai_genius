"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Loader2, Copy, RotateCcw, Download, Check } from "lucide-react";

interface FieldSchema {
  id: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface FormUIProps {
  agentId: string;
  agentName: string;
  inputSchema: FieldSchema[];
  outputLabel?: string;
}

export function FormUI({ agentId, agentName, inputSchema, outputLabel = "Generated Output" }: FormUIProps) {
  const [fields, setFields] = useState<Record<string, string | number | boolean>>({});
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const updateField = (id: string, value: string | number | boolean) => {
    setFields((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    for (const field of inputSchema) {
      if (field.required && !fields[field.id]) {
        setError(`${field.label} is required`);
        return;
      }
    }
    setIsLoading(true);
    setError(null);
    setOutput(null);

    try {
      const response = await fetch(`/api/tools/${agentId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "form", fields }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `Error: ${response.status}`);
      }
      const result = await response.json();
      setOutput(result.content || JSON.stringify(result, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (output) { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${agentName.toLowerCase().replace(/\s+/g, "-")}-output.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const renderField = (field: FieldSchema) => {
    if (field.type === "textarea") {
      return (
        <textarea id={field.id} placeholder={field.placeholder} value={(fields[field.id] as string) || ""}
          onChange={(e) => updateField(field.id, e.target.value)} rows={3}
          className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
      );
    }
    if (field.type === "select") {
      return (
        <select id={field.id} value={(fields[field.id] as string) || ""}
          onChange={(e) => updateField(field.id, e.target.value)}
          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Select...</option>
          {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    if (field.type === "checkbox") {
      return (
        <div className="flex items-center gap-2">
          <input type="checkbox" id={field.id} checked={!!fields[field.id]}
            onChange={(e) => updateField(field.id, e.target.checked)} className="h-4 w-4 rounded border-input" />
          <span className="text-sm text-muted-foreground">{field.placeholder || "Enable"}</span>
        </div>
      );
    }
    return (
      <Input id={field.id} type={field.type === "number" ? "number" : "text"} placeholder={field.placeholder}
        value={(fields[field.id] as string) || ""} className="rounded-xl"
        onChange={(e) => updateField(field.id, field.type === "number" ? Number(e.target.value) : e.target.value)} />
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Fill in the details below</h2>
            <p className="text-sm text-muted-foreground mt-1">Complete the form and click Generate to get your output.</p>
          </div>
          <div className="space-y-4">
            {inputSchema.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label htmlFor={field.id} className="text-sm font-medium flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-destructive text-xs">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>
          )}
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full h-11 rounded-xl text-sm font-medium">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : "Generate →"}
          </Button>
        </div>

        {(output || isLoading) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{outputLabel}</h3>
              {output && (
                <div className="flex items-center gap-1">
                  <button onClick={handleCopy} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </button>
                  <button onClick={handleDownload} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Download className="h-3 w-3" /> Download
                  </button>
                  <button onClick={handleSubmit} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <RotateCcw className="h-3 w-3" /> Regenerate
                  </button>
                </div>
              )}
            </div>
            <div className="rounded-2xl border bg-muted/30 p-6 min-h-[120px]">
              {isLoading && !output ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-3 text-sm text-muted-foreground">Generating your output...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{output}</div>
              )}
            </div>
          </div>
        )}

        {inputSchema.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">This form agent has no input fields configured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
