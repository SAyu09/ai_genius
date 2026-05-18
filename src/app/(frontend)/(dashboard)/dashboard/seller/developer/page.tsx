import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq, ne, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Terminal, Server, ShieldCheck } from "lucide-react";
import { DeveloperCredentialsCard } from "./DeveloperCredentialsCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer & API — AI Genius",
  description: "Comprehensive documentation for SDK integration.",
};

export default async function DeveloperDocsPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) redirect("/marketplace");

  // Fetch seller's SDK agents (not workflow)
  const myAgents = await db.query.agents.findMany({
    where: and(
      eq(agents.sellerId, session.user.id),
      ne(agents.agentType, "workflow")
    ),
  });

  const serializedAgents = myAgents.map(a => ({
    id: a.id,
    name: a.name,
    endpointUrl: a.endpointUrl,
  }));

  return (
    <div className="p-6 lg:p-12 space-y-12 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="font-display text-4xl font-bold">Developer & API</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Manage your SDK credentials and integrate your backend with the AI Genius Marketplace.
        </p>
      </div>

      {/* Primary Action Panel at the top */}
      <DeveloperCredentialsCard agents={serializedAgents} />

      <div className="relative pt-8">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block"></div>
        
        <div className="space-y-12">
          <div className="relative md:pl-20">
            <div className="absolute left-[1.15rem] top-6 w-5 h-5 rounded-full bg-primary border-4 border-background hidden md:block z-10"></div>
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="bg-primary/5 p-6 border-b border-border/50">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-primary" />
                  Step 1: Install the SDK
                </h2>
              </div>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  The easiest way to integrate with our platform is to use the official AI Genius SDK in your Node.js backend. 
                  This handles all the complex HMAC signature verification and streaming for you.
                </p>
                <div className="bg-[#0D1117] rounded-xl p-4 flex justify-between items-center relative overflow-hidden">
                  <code className="text-sm text-green-400 font-mono">npm install @aigenius/sdk</code>
                  <div className="absolute right-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Terminal</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative md:pl-20">
            <div className="absolute left-[1.15rem] top-6 w-5 h-5 rounded-full bg-primary border-4 border-background hidden md:block z-10"></div>
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="bg-primary/5 p-6 border-b border-border/50">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Step 2: Create your Endpoint
                </h2>
              </div>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Create a POST route on your server (this should match the <code>Endpoint URL</code> you entered when creating your listing). 
                  Import the SDK and use the <code>verify</code> middleware to authenticate requests.
                </p>
                
                <div className="bg-[#0D1117] rounded-xl p-5 overflow-x-auto">
                  <pre className="text-[13px] text-gray-300 font-mono leading-relaxed">
{`import { createAgent } from "@aigenius/sdk";

// Initialize with your unique agent secret (from the panel above)
const agent = createAgent({
  secret: process.env.AIGENIUS_SECRET, 
});

// Example Express Route
app.post("/api/ai-genius-webhook", async (req, res) => {
  try {
    // 1. Verify the HMAC signature (throws error if invalid)
    const payload = agent.verify(req.headers, req.body);
    
    // 2. Extract user input from the platform payload
    const userPrompt = payload.messages[payload.messages.length - 1].content;
    
    // 3. Process the input (e.g. call OpenAI, query your database)
    const result = await yourCustomLogic(userPrompt);
    
    // 4. Return the result back to the marketplace UI
    res.json({ response: result });
    
  } catch (error) {
    res.status(401).json({ error: "Unauthorized Request" });
  }
});`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative md:pl-20">
            <div className="absolute left-[1.15rem] top-6 w-5 h-5 rounded-full bg-primary border-4 border-background hidden md:block z-10"></div>
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="bg-primary/5 p-6 border-b border-border/50">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Step 3: Security & Testing
                </h2>
              </div>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  When a buyer uses your agent on our marketplace, our Cloudflare worker intercepts the request, verifies the buyer's subscription, and forwards the request to your endpoint.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Every request is securely signed with an <code>x-aigenius-signature</code> header.</li>
                  <li>The payload contains a timestamp. Requests older than 5 minutes will automatically be rejected by the SDK to prevent replay attacks.</li>
                  <li>You <strong>must</strong> keep your <code>AIGenius_SECRET</code> completely private. Never expose it in frontend code.</li>
                </ul>
                
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-700 text-sm">
                  <strong>Important:</strong> Your endpoint must respond within 10 seconds, otherwise the platform will timeout the request and mark an error on your agent's performance score.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
