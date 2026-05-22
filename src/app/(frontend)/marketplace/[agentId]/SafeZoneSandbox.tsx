"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Bot, Send, User, Sparkles } from "lucide-react";

export function SafeZoneSandbox({ agentName, latencyMs }: { agentName: string; latencyMs: number }) {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string }[]>([
    { role: "bot", content: `Hello! I am ${agentName}. Try sending me a prompt in this sandbox to test my capabilities.` }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userText }]);
    setInput("");
    setIsTyping(true);

    // Simulate network latency & agent response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "bot", 
        content: `(Simulated Sandbox Response via ${latencyMs}ms connection)\n\nBased on your prompt "${userText}", I've analyzed the data and compiled the optimal workflow steps...` 
      }]);
      setIsTyping(false);
    }, latencyMs > 0 ? latencyMs + 500 : 1200);
  };

  return (
    <div className="flex flex-col h-[500px] border border-border rounded-2xl overflow-hidden bg-background shadow-sm mt-8">
      <div className="bg-muted/30 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-sm text-foreground">Interactive Sandbox</span>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">Safe Zone</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
              {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50 border whitespace-pre-wrap"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-muted/50 border flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce delay-75" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce delay-150" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-muted/20 border-t flex gap-2">
        <Input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Test a prompt..." 
          className="bg-background rounded-xl"
        />
        <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={!input.trim() || isTyping}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
