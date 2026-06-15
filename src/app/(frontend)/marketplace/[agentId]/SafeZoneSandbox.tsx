"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Bot, Send, User, Sparkles, Paperclip } from "lucide-react";

interface Message {
 id: string;
 role: "user" | "bot" | "system";
 content: string;
 timestamp: Date;
 latencyMs?: number;
}

export function SafeZoneSandbox({ 
 agentId,
 agentName, 
 latencyMs,
 integrationType,
 workflowData,
 endpointUrl
}: { 
 agentId: string;
 agentName: string; 
 latencyMs: number;
 integrationType: string;
 workflowData: any;
 endpointUrl: string | null;
}) {
 const [messages, setMessages] = useState<Message[]>(() => {
 let description = "I am ready to assist you based on my configured workflow.";
 if (integrationType === "workflow" && workflowData && workflowData.nodes) {
 const nodes = workflowData.nodes as any[];
 const toolNodes = nodes.filter(n => n.type?.toLowerCase().includes("tool"));
 const toolNames = toolNodes.map(n => n.name);
 
 if (toolNames.length > 0) {
 description = `I can help you with tasks like: **${toolNames.join(", ")}**.`;
 }
 }

 return [
 {
 id: "welcome",
 role: "bot",
 content: `👋 Hello! I'm the Interactive Preview for "${agentName || "your agent"}".\n\n${integrationType === "workflow" ? description : "Messages will be sent to the seller's endpoint for live testing."}`,
 timestamp: new Date(),
 }
 ];
 });

 const [input, setInput] = useState("");
 const [isTyping, setIsTyping] = useState(false);
 const [messageCount, setMessageCount] = useState(0);
 const [mockDataContext, setMockDataContext] = useState<string>("");
 const fileInputRef = useRef<HTMLInputElement>(null);
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const msgIdCounter = useRef(0);

 const MAX_TEST_MESSAGES = 3;

 const nextId = (prefix: string) => `${prefix}-${++msgIdCounter.current}`;

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 }, [messages, isTyping]);

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 try {
 const text = await file.text();
 const truncated = text.slice(0, 4000); 
 setMockDataContext(prev => prev ? prev + "\n" + truncated : truncated);
 
 const sysMsg: Message = {
 id: nextId("sys"),
 role: "system",
 content: `📄 Attached mock dataset: ${file.name}. The assistant will now use this context to answer your queries.`,
 timestamp: new Date(),
 };
 setMessages((prev) => [...prev, sysMsg]);
 } catch (err) {
 console.error(err);
 }
 
 if (fileInputRef.current) fileInputRef.current.value = "";
 };

 const handleSend = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!input.trim() || isTyping) return;

 if (messageCount >= MAX_TEST_MESSAGES) {
 setMessages(prev => [...prev, {
 id: nextId("sys"),
 role: "system",
 content: "🔒 Trial limit reached. Subscribe to unlock full access to this agent.",
 timestamp: new Date()
 }]);
 setInput("");
 return;
 }

 const userText = input.trim();
 const userMsg: Message = {
 id: nextId("user"),
 role: "user",
 content: userText,
 timestamp: new Date(),
 };
 setMessages((prev) => [...prev, userMsg]);
 setInput("");
 setIsTyping(true);
 setMessageCount(prev => prev + 1);

 if (integrationType === "workflow") {
 const start = Date.now();
 try {
 const res = await fetch("/api/agents/simulate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ 
 messages: [...messages, userMsg],
 workflowData,
 mockDataContext
 })
 });
 const data = await res.json();
 
 const botMsg: Message = {
 id: nextId("bot"),
 role: "bot",
 content: data.reply || (data.error ? `Error: ${data.error}` : "No response generated."),
 timestamp: new Date(),
 latencyMs: Date.now() - start,
 };
 setMessages((prev) => [...prev, botMsg]);
 } catch (err) {
 setMessages((prev) => [...prev, {
 id: nextId("bot"),
 role: "bot",
 content: "❌ Failed to reach AI simulation engine.",
 timestamp: new Date(),
 latencyMs: 0,
 }]);
 }
 setIsTyping(false);
 } else {
 // For API: try live endpoint communication
 const start = Date.now();
 try {
 const res = await fetch(
 `/api/sellers/agents/${agentId}/test-endpoint`,
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ endpointUrl }),
 }
 );
 const data = await res.json();
 const latency = Date.now() - start;

 if (res.ok && data.passed) {
 setMessages((prev) => [...prev, {
 id: nextId("bot"),
 role: "bot",
 content: `Endpoint responded successfully.\n\n📊 Latency: ${Math.round(data.avgMs)}ms`,
 timestamp: new Date(),
 latencyMs: latency,
 }]);
 } else {
 setMessages((prev) => [...prev, {
 id: nextId("bot"),
 role: "bot",
 content: `⚠️ Endpoint test had issues.\n\n📊 Latency: ${data.avgMs ? Math.round(data.avgMs) + "ms" : "N/A"}\n❌ Error rate: ${Math.round((data.errorRate || 1) * 100)}%`,
 timestamp: new Date(),
 latencyMs: latency,
 }]);
 }
 } catch {
 setMessages((prev) => [...prev, {
 id: nextId("bot"),
 role: "bot",
 content: "❌ Failed to reach endpoint.",
 timestamp: new Date(),
 latencyMs: Date.now() - start,
 }]);
 }
 setIsTyping(false);
 }
 };

 const isLimitReached = messageCount >= MAX_TEST_MESSAGES;

 return (
 <div className="flex flex-col h-[500px] bg-background shadow-sm">
 <div className="bg-muted/30 border-b border-border px-4 py-3 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Sparkles className="h-4 w-4 text-emerald-500" />
 <span className="font-semibold text-sm text-foreground">Interactive Sandbox</span>
 </div>
 <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">Safe Zone</span>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 {messages.map((m) => (
 <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"} ${m.role === "system" ? "justify-center" : ""}`}>
 {m.role === "system" ? (
 <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 max-w-[90%] text-center">
 {m.content}
 </div>
 ) : (
 <>
 <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-600"}`}>
 {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
 </div>
 <div className="flex flex-col gap-1 max-w-[80%]">
 <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-teal-600 text-white rounded-tr-md" : "bg-muted/50 border rounded-tl-md whitespace-pre-wrap"}`}>
 {m.content}
 </div>
 {m.latencyMs !== undefined && (
 <span className="text-[10px] text-muted-foreground/60 px-2">⏱ {m.latencyMs}ms</span>
 )}
 </div>
 </>
 )}
 </div>
 ))}

 {isTyping && (
 <div className="flex gap-3">
 <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
 <Bot className="h-4 w-4" />
 </div>
 <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-muted/50 border flex items-center gap-1.5">
 <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "0ms" }} />
 <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "150ms" }} />
 <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "300ms" }} />
 </div>
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>

 <form onSubmit={handleSend} className="p-3 bg-muted/20 border-t flex gap-2">
 {integrationType === "workflow" && (
 <>
 <input 
 type="file" 
 ref={fileInputRef} 
 className="hidden" 
 accept=".csv,.txt,.md,.json" 
 onChange={handleFileUpload}
 disabled={isLimitReached}
 />
 <Button
 type="button"
 variant="outline"
 size="icon"
 onClick={() => fileInputRef.current?.click()}
 className="rounded-xl h-11 w-11 shrink-0 bg-background hover:bg-muted"
 title="Attach Mock CSV/Data for Testing"
 disabled={isLimitReached}
 >
 <Paperclip className="h-5 w-5 text-muted-foreground" />
 </Button>
 </>
 )}
 <Input 
 value={input} 
 onChange={e => setInput(e.target.value)} 
 placeholder={isLimitReached ? "Trial limit reached." : "Test a prompt..."}
 className="bg-background rounded-xl h-11"
 disabled={isTyping || isLimitReached}
 />
 <Button type="submit" size="icon" className="rounded-xl h-11 w-11 shrink-0 bg-teal-600 hover:bg-teal-700 text-white" disabled={!input.trim() || isTyping || isLimitReached}>
 <Send className="h-4 w-4" />
 </Button>
 </form>
 </div>
 );
}
