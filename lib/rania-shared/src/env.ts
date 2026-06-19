// ============================================================================
// RANIA V2.1 — Environment Variable Types per Worker
// ============================================================================

// ─── Shared Environment (all workers) ────────────────────────────────────────

export interface SharedEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  WABLAS_API_KEY: string;
  WABLAS_SECRET: string;
  ADMIN_WHATSAPP: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
}

// ─── Worker-Parser Environment ────────────────────────────────────────────────

export interface ParserEnv extends SharedEnv {
  GROQ_API_KEY_1: string;
  GROQ_API_KEY_2: string;
  GEMINI_API_KEY: string;
  CEREBRAS_KEY: string;
  WORKER_HUNTER_URL: string;
  WORKER_VALIDATOR_URL: string;
  WORKER_CASHIER_URL: string;
}

// ─── Worker-Hunter Environment ───────────────────────────────────────────────

export interface HunterEnv extends SharedEnv {
  TRAVELPORT_API_KEY: string;
  TRAVELPORT_SECRET: string;
  TRIP_API_KEY: string;
  TRAVELPAYOUTS_TOKEN: string;
  TRAVELPAYOUTS_MARKER: string;
  AVIATIONSTACK_KEY: string;
}

// ─── Worker-Validator Environment ────────────────────────────────────────────

export interface ValidatorEnv extends SharedEnv {
  GEMINI_API_KEY: string;
  AI: Ai; // Cloudflare Workers AI binding
}

// ─── Worker-Cashier Environment ──────────────────────────────────────────────

export interface CashierEnv extends SharedEnv {
  XENDIT_API_KEY: string;
  XENDIT_WEBHOOK_VERIFICATION_TOKEN: string;
}

// ─── Worker-Webhook Environment ──────────────────────────────────────────────

export interface WebhookEnv extends SharedEnv {
  XENDIT_WEBHOOK_VERIFICATION_TOKEN: string;
  WORKER_PILOT_URL: string;
}

// ─── Worker-Pilot Environment ────────────────────────────────────────────────

export interface PilotEnv extends SharedEnv {
  TRAVELPORT_API_KEY: string;
  TRAVELPORT_SECRET: string;
  WORKER_ADMIN_URL: string;
  TICKETS: R2Bucket; // Cloudflare R2 binding
}

// ─── Worker-Admin Environment ────────────────────────────────────────────────

export interface AdminEnv extends SharedEnv {
  XENDIT_API_KEY: string;
  WORKER_PILOT_URL: string;
  WORKER_CASHIER_URL: string;
}

// ─── Cloudflare AI Type (minimal) ────────────────────────────────────────────

export interface Ai {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

// ─── Cloudflare R2 Types (minimal) ───────────────────────────────────────────

export interface R2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream | string, options?: R2PutOptions): Promise<R2Object>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
}

export interface R2PutOptions {
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json(): Promise<unknown>;
}
