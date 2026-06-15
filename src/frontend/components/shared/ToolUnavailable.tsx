import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { Construction, MoveRight } from "lucide-react";

interface ToolUnavailableProps {
  agentName?: string;
}

/**
 * Branded fallback page when a seller's tool fails to load or is suspended.
 * Shows AI Genius branding only — no seller info leaks.
 */
export function ToolUnavailable({ agentName }: ToolUnavailableProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-muted mb-6">
          <Construction className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl font-semibold mb-2">
          Tool Temporarily Unavailable
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          {agentName ? `"${agentName}" is` : "This tool is"} temporarily
          unavailable. Our team has been notified and is working on it. In the
          meantime, explore other powerful AI tools.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="rounded-xl gap-2">
            <Link href="/marketplace">
              Explore Other Tools <MoveRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
