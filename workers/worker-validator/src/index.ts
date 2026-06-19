// ============================================================================
// RANIA V2.1 — Worker Validator (Passport OCR)
// POST /api/validate — Validate passport via OCR
//
// IRON RULE #3: On error → status='VERIFY' (never auto-reject)
// ============================================================================

interface Env {
  GEMINI_API_KEY: string;
  AI: { run(model: string, inputs: Record<string, unknown>): Promise<unknown> };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// ─── Passport Validation Rules ──────────────────────────────────────────────

function validatePassportNumber(num: string): { valid: boolean; error?: string } {
  // Most passports: 6-9 alphanumeric characters
  if (!/^[A-Z0-9]{6,9}$/i.test(num)) {
    return { valid: false, error: "Nomor paspor tidak valid. Format: 6-9 karakter alfanumerik." };
  }
  return { valid: true };
}

function validateExpiry(expiry: string, travelDate: string): { valid: boolean; error?: string } {
  const expDate = new Date(expiry);
  const travel = new Date(travelDate);
  if (isNaN(expDate.getTime())) {
    return { valid: false, error: "Tanggal kadaluarsa paspor tidak valid." };
  }
  if (isNaN(travel.getTime())) {
    return { valid: false, error: "Tanggal perjalanan tidak valid." };
  }
  // Must be valid for at least 6 months after travel date
  const sixMonths = new Date(travel);
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  if (expDate < sixMonths) {
    return {
      valid: false,
      error: `Paspor kadaluarsa pada ${expiry}. Harus berlaku minimal 6 bulan setelah tanggal perjalanan (${travelDate}).`,
    };
  }
  return { valid: true };
}

function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length < 2) {
    return { valid: false, error: "Nama tidak valid. Minimal 2 karakter." };
  }
  // Names should only contain letters, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z\s\-'.]+$/.test(name)) {
    return { valid: false, error: "Nama mengandung karakter tidak valid. Gunakan huruf, spasi, dan tanda hubung saja." };
  }
  return { valid: true };
}

// ─── OCR using Gemini Vision ─────────────────────────────────────────────────

async function ocrWithGemini(imageBase64: string, apiKey: string): Promise<{
  name?: string;
  passportNumber?: string;
  expiryDate?: string;
  nationality?: string;
  dateOfBirth?: string;
  confidence: number;
  rawText: string;
}> {
  const prompt = `Extract the following fields from this passport image:
1. Full Name (as written on passport)
2. Passport Number
3. Date of Expiry (format: YYYY-MM-DD)
4. Nationality
5. Date of Birth (format: YYYY-MM-DD)

Return ONLY a JSON object with these exact keys:
{"name": "...", "passportNumber": "...", "expiryDate": "YYYY-MM-DD", "nationality": "...", "dateOfBirth": "YYYY-MM-DD", "confidence": 0.0-1.0}

If a field cannot be read, set it to null.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
            ],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as {
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name || undefined,
        passportNumber: parsed.passportNumber || undefined,
        expiryDate: parsed.expiryDate || undefined,
        nationality: parsed.nationality || undefined,
        dateOfBirth: parsed.dateOfBirth || undefined,
        confidence: parsed.confidence || 0.8,
        rawText: text,
      };
    }

    return { confidence: 0.5, rawText: text };
  } catch (error) {
    console.error("OCR error:", error);
    return { confidence: 0, rawText: `OCR failed: ${error instanceof Error ? error.message : "unknown"}` };
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

async function handleValidate(request: Request, env: Env): Promise<Response> {
  let body: { imageUrl?: string; travelDate?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { imageUrl, travelDate } = body;
  if (!imageUrl || !travelDate) {
    return json({ error: "Missing required fields: imageUrl, travelDate" }, 400);
  }

  // Perform OCR
  let ocrResult: Awaited<ReturnType<typeof ocrWithGemini>>;
  if (env.GEMINI_API_KEY) {
    // Strip data URL prefix if present
    const base64 = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    ocrResult = await ocrWithGemini(base64, env.GEMINI_API_KEY);
  } else {
    // Mock OCR for development
    ocrResult = {
      name: "MOCK PASSENGER NAME",
      passportNumber: "A12345678",
      expiryDate: "2030-12-31",
      nationality: "Timor-Leste",
      dateOfBirth: "1990-01-15",
      confidence: 0.95,
      rawText: "Mock OCR result — will use real Gemini Vision in production",
    };
  }

  // Validate extracted data
  const errors: string[] = [];
  const warnings: string[] = [];

  if (ocrResult.name) {
    const nameCheck = validateName(ocrResult.name);
    if (!nameCheck.valid) errors.push(nameCheck.error!);
  } else {
    errors.push("Nama tidak terbaca dari paspor.");
  }

  if (ocrResult.passportNumber) {
    const numCheck = validatePassportNumber(ocrResult.passportNumber);
    if (!numCheck.valid) errors.push(numCheck.error!);
  } else {
    errors.push("Nomor paspor tidak terbaca.");
  }

  if (ocrResult.expiryDate) {
    const expCheck = validateExpiry(ocrResult.expiryDate, travelDate);
    if (!expCheck.valid) errors.push(expCheck.error!);
  } else {
    errors.push("Tanggal kadaluarsa tidak terbaca.");
  }

  // Low confidence warning
  if (ocrResult.confidence < 0.7) {
    warnings.push("Tingkat kepercayaan OCR rendah. Harap verifikasi data secara manual.");
  }

  const valid = errors.length === 0;
  const needsVerify = !valid || ocrResult.confidence < 0.7;

  return json({
    valid,
    errors,
    warnings,
    extractedData: {
      name: ocrResult.name,
      passportNumber: ocrResult.passportNumber,
      expiryDate: ocrResult.expiryDate,
      nationality: ocrResult.nationality,
      dateOfBirth: ocrResult.dateOfBirth,
    },
    ocrConfidence: ocrResult.confidence,
    needsVerify,
    // Iron Rule #3: if not valid, status = VERIFY (not auto-reject)
    status: needsVerify ? "VERIFY" : "VALID",
  });
}

// ─── Worker Export ───────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({
        status: "ok",
        worker: "rania-validator",
        version: "2.1.0",
        geminiConfigured: !!env.GEMINI_API_KEY,
        timestamp: new Date().toISOString(),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/validate") {
      try {
        return await handleValidate(request, env);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Internal error";
        console.error("Validate error:", msg);
        return json({ error: "Internal server error" }, 500);
      }
    }

    return json({ error: "Not Found" }, 404);
  },
};
