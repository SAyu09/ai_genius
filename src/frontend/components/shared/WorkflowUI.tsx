"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Loader2, CircleCheck, CircleX, MoveRight } from "lucide-react";

interface Step {
  id: string;
  title: string;
  status: "done" | "error" | "pending" | "running";
  output: string;
}

interface WorkflowUIProps {
  agentId: string;
  agentName: string;
}

export function WorkflowUI({ agentId, agentName }: WorkflowUIProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputData, setInputData] = useState("");

  const handleRun = async () => {
    if (!inputData.trim()) {
      setError("Please provide input for the workflow");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSteps([]);

    try {
      const response = await fetch(`/api/tools/${agentId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "workflow", step: "run", data: { input: inputData } }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `Error: ${response.status}`);
      }

      const result = await response.json();
      if (result.steps) {
        setSteps(result.steps.map((s: any) => ({ ...s, status: s.status || "done" })));
      } else if (result.content) {
        setSteps([{ id: "result", title: "Result", status: "done", output: result.content }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const statusIcon = (status: Step["status"]) => {
    switch (status) {
      case "done": return <CircleCheck className="h-5 w-5 text-green-500" />;
      case "error": return <CircleX className="h-5 w-5 text-red-500" />;
      case "running": return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-8">
        {/* Input */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Workflow Input</h2>
            <p className="text-sm text-muted-foreground mt-1">Provide the input data for this multi-step workflow.</p>
          </div>
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Describe what you need..."
            rows={4}
            className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>
          )}
          <Button onClick={handleRun} disabled={isLoading} className="w-full h-11 rounded-xl">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running Workflow...</> : <>Run Workflow <MoveRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>

        {/* Steps */}
        {steps.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Workflow Steps</h3>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={step.id} className="rounded-2xl border bg-background p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {statusIcon(step.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">Step {i + 1}</span>
                        <h4 className="text-sm font-semibold">{step.title}</h4>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      step.status === "done" ? "bg-green-500/10 text-green-600" :
                      step.status === "error" ? "bg-red-500/10 text-red-500" :
                      step.status === "running" ? "bg-blue-500/10 text-blue-600" :
                      "bg-muted text-muted-foreground"
                    }`}>{step.status}</span>
                  </div>
                  {step.output && (
                    <div className="mt-3 rounded-xl bg-muted/30 p-3">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{step.output}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
