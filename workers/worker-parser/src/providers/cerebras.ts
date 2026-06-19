// ============================================================================
// RANIA V2.1 — Cerebras AI Provider (Backup)
// Uses Llama 3.1 8B — fast inference
// ============================================================================

/**
 * Call Cerebras API (text-only, no function calling support).
 * Used as final fallback when Groq and Gemini both fail.
 */
export async function callCerebras(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  apiKey: string
): Promise<{ reply?: string; provider: string }> {
  try {
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Cerebras API error (${response.status}):`, err);
      return { reply: undefined, provider: "cerebras" };
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const reply = data.choices[0]?.message?.content;
    return {
      reply: reply || undefined,
      provider: "cerebras",
    };
  } catch (error) {
    console.error("Cerebras error:", error);
    return { reply: undefined, provider: "cerebras" };
  }
}
