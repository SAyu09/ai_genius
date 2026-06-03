import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, workflowData, mockDataContext } = await req.json();

    let systemPrompt = "You are an intelligent data analysis assistant.";
    if (workflowData && workflowData.nodes) {
      const nodes = workflowData.nodes as any[];
      const modelNodes = nodes.filter(n => n.type?.toLowerCase().includes("lmchat") || n.type?.toLowerCase().includes("openai"));
      const modelName = modelNodes.length > 0 ? (modelNodes[0].parameters?.model?.value || modelNodes[0].name) : "Default AI Model";

      const toolNodes = nodes.filter(n => n.type?.toLowerCase().includes("tool"));
      const toolNames = toolNodes.map(n => n.name).join(", ");
      
      const agentNodes = nodes.filter(n => n.type?.toLowerCase().includes("agent"));
      const agentName = agentNodes.length > 0 ? agentNodes[0].name : "Workflow Agent";

      // Check if there is an explicit system message in the agent node
      let extractedSystemMessage = "";
      if (agentNodes.length > 0 && agentNodes[0].parameters?.options?.systemMessage) {
        extractedSystemMessage = agentNodes[0].parameters.options.systemMessage;
      }

      systemPrompt = `You are a simulated AI agent named ${agentName}. You are running in a "Live Preview" mode for an n8n workflow testing environment.
You are powered by ${modelName} and have the following tools available: ${toolNames ? toolNames : 'None'}.
If the user asks questions about their data (like marketing spend, campaigns, conversions, or anything related to the Google Sheet), confidently pretend you have successfully used your tools to fetch a generic mock dataset and provide plausible, realistic numerical answers. Answer naturally in a helpful tone.

Original Workflow Instructions:
${extractedSystemMessage}`;
    }

    if (mockDataContext) {
      systemPrompt += `\n\n--- MOCK DATA CONTEXT SUPPLIED BY USER ---\nPlease answer the user's questions based on the following data context. Pretend you fetched this data using your tools.\n\n${mockDataContext}\n------------------------------------------`;
    }

    // Map the UI messages to standard OpenAI/NVIDIA API format.
    // UI roles: "user", "bot", "system"
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
        .filter((m: any) => m.role === "user" || m.role === "bot")
        .map((m: any) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.content
        }))
    ];

    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `NVIDIA API Error: ${errText}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
