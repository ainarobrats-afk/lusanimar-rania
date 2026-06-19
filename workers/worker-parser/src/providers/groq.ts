// ============================================================================
// RANIA V2.1 — Groq AI Provider (Primary)
// Uses Llama 3.3 70B with function calling support
// ============================================================================

import { FUNCTION_DEFINITIONS } from "../functions/definitions";
import type { FunctionDef } from "@workspace/rania-shared/types";

interface GroqMessage {
  role: string;
  content: string | null;
  name?: string;
  function_call?: { name: string; arguments: string };
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string | null;
      function_call?: { name: string; arguments: string };
    };
    finish_reason: string;
  }>;
}

/**
 * Call Groq API with function calling support.
 * Returns either a text reply or a function call request.
 */
export async function callGroq(
  messages: GroqMessage[],
  systemPrompt: string,
  apiKey: string,
  enableFunctions = true,
  functionDefs?: FunctionDef[]
): Promise<{ reply?: string; functionCall?: { name: string; arguments: string }; provider: string }> {
  try {
    const body: Record<string, unknown> = {
      model: "llama-3.1-8b-instant",  // Fast model — CF Worker CPU limit safe
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 600,
    };

    // Only include functions when enableFunctions=true (not for greetings)
    if (enableFunctions) {
      const defs = functionDefs || FUNCTION_DEFINITIONS;
      body.functions = defs.map(f => ({
        name: f.name,
        description: f.description,
        parameters: f.parameters,
      }));
      body.function_call = "auto";
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),  // 20s timeout
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Groq API error (${response.status}):`, err);
      return { reply: undefined, provider: "groq" };
    }

    const data = (await response.json()) as GroqResponse;
    const choice = data.choices[0];

    if (!choice) return { reply: undefined, provider: "groq" };

    // Function call response
    if (choice.message.function_call) {
      return {
        functionCall: choice.message.function_call,
        provider: "groq",
      };
    }

    // Text response
    return {
      reply: choice.message.content || undefined,
      provider: "groq",
    };
  } catch (error) {
    console.error("Groq error:", error);
    return { reply: undefined, provider: "groq" };
  }
}
