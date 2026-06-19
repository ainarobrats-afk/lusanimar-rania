// ============================================================================
// RANIA V2.1 — Gemini AI Provider (Backup)
// Uses Gemini 1.5 Flash with function calling
// ============================================================================

import { FUNCTION_DEFINITIONS } from "../functions/definitions";
import type { FunctionDef } from "@workspace/rania-shared/types";

/**
 * Call Gemini API with function calling support.
 * enableFunctions=false disables function calling (for greetings).
 */
export async function callGemini(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  apiKey: string,
  enableFunctions = true,
  functionDefs?: FunctionDef[]
): Promise<{ reply?: string; functionCall?: { name: string; arguments: string }; provider: string }> {
  try {
    // Convert messages to Gemini format
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const requestBody: Record<string, unknown> = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    };

    // Only include tools when enableFunctions=true
    if (enableFunctions) {
      const defs = functionDefs || FUNCTION_DEFINITIONS;
      requestBody.tools = [{
        function_declarations: defs.map(f => ({
          name: f.name,
          description: f.description,
          parameters: f.parameters,
        })),
      }];
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error(`Gemini API error (${response.status}):`, err);
      return { reply: undefined, provider: "gemini" };
    }

    const data = await response.json() as {
      candidates?: Array<{
        content: {
          parts: Array<{
            text?: string;
            functionCall?: { name: string; args: Record<string, unknown> };
          }>;
        };
      }>;
    };

    const candidate = data.candidates?.[0];
    if (!candidate) return { reply: undefined, provider: "gemini" };

    const part = candidate.content.parts[0];
    if (!part) return { reply: undefined, provider: "gemini" };

    // Function call response
    if (part.functionCall) {
      return {
        functionCall: {
          name: part.functionCall.name,
          arguments: JSON.stringify(part.functionCall.args),
        },
        provider: "gemini",
      };
    }

    // Text response
    return {
      reply: part.text || undefined,
      provider: "gemini",
    };
  } catch (error) {
    console.error("Gemini error:", error);
    return { reply: undefined, provider: "gemini" };
  }
}
