// ============================================================================
// RANIA V2.1 — Shared Type Definitions
// The Safe Ghost Engine
// ============================================================================

// ─── Booking Status Flow ─────────────────────────────────────────────────────
// SEARCH → VALIDATED → PAYMENT_PENDING → PAID → BOOKING → BOOKED
// Any error → VERIFY (admin review, never auto-refund)
// Admin actions: APPROVE | REJECT | REFUND

export type BookingStatus =
  | "SEARCH"
  | "VALIDATED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "BOOKING"
  | "BOOKED"
  | "VERIFY"
  | "FAILED"
  | "CANCELLED";

export type PaymentMethod = "QRIS" | "VA" | "CC" | "BANK_TRANSFER";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "EXPIRED";
export type FlightSource = "travelport" | "trip" | "travelpayouts";
export type AuditActor = "user" | "system" | "admin";
export type AdminAction = "APPROVE" | "REJECT" | "REFUND";
export type Language = "id" | "tet" | "pt" | "en";

// ─── Flight Search ───────────────────────────────────────────────────────────

export interface FlightSegment {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: string;          // IATA code
  to: string;            // IATA code
  departureTime: string; // ISO 8601
  arrivalTime: string;   // ISO 8601
  duration: string;      // e.g. "2h 30m"
  aircraft?: string;
  cabinClass: "economy" | "business" | "first";
}

export interface FlightResult {
  id: string;
  source: FlightSource;
  segments: FlightSegment[];
  price: number;
  currency: string;
  totalPrice: number;    // price + taxes + fees
  taxes: number;
  fees: number;
  available: boolean;
  lastUpdated: string;   // ISO 8601 — MUST be from API, never static
  bookingUrl?: string;
  deepLink?: string;
  rawData?: Record<string, unknown>;
}

export interface SearchRequest {
  origin: string;        // IATA code
  destination: string;   // IATA code
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;   // YYYY-MM-DD (optional for one-way)
  passengers: number;
  cabinClass?: "economy" | "business" | "first";
  sessionId?: string;
}

export interface SearchResponse {
  results: FlightResult[];
  totalResults: number;
  sources: FlightSource[];
  searchId: string;
  cachedAt?: string;
}

// ─── Passenger ───────────────────────────────────────────────────────────────

export interface Passenger {
  id: string;
  bookingId?: string;
  fullName: string;
  passportNumber: string;
  passportExpiry: string;  // YYYY-MM-DD
  nationality: string;
  dateOfBirth: string;     // YYYY-MM-DD
  email?: string;
  phone?: string;
  ocrResult?: OcrResult;
}

export interface OcrResult {
  rawText: string;
  confidence: number;
  fields: {
    name?: { value: string; confidence: number };
    passportNumber?: { value: string; confidence: number };
    expiryDate?: { value: string; confidence: number };
    nationality?: { value: string; confidence: number };
    dateOfBirth?: { value: string; confidence: number };
  };
  provider: string;
}

// ─── Booking ─────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  status: BookingStatus;
  sessionId: string;
  createdAt: string;
  updatedAt: string;

  // Flight data (ALL from API, never hardcoded)
  flightId?: string;
  flightSource?: FlightSource;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: Passenger[];
  selectedFlight?: FlightResult;

  // Pricing (ALL from API)
  basePrice?: number;
  taxes?: number;
  fees?: number;
  totalPrice?: number;
  currency: string;
  profitMargin?: number;

  // Payment
  paymentId?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  xenditInvoiceId?: string;
  xenditPaymentUrl?: string;

  // Booking result
  pnr?: string;              // PNR from Travelport
  eTicketUrl?: string;       // R2 URL for original e-ticket PDF
  invoiceUrl?: string;       // R2 URL for RANIA invoice PDF

  // Error handling
  verifyReason?: string;     // Why was VERIFY triggered
  verifyAt?: string;         // When was VERIFY triggered
  errorMessage?: string;

  // Metadata
  data?: Record<string, unknown>;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  bookingId: string;
  xenditId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  invoiceUrl?: string;
  qrCodeUrl?: string;
  webhookData?: Record<string, unknown>;
  createdAt: string;
  paidAt?: string;
  expiredAt?: string;
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

export interface XenditWebhookPayload {
  id: string;
  external_id: string;
  user_id: string;
  is_high: boolean;
  payment_method: string;
  status: string;
  merchant_name: string;
  amount: number;
  paid_amount: number;
  bank_code?: string;
  paid_at?: string;
  payer_email?: string;
  description?: string;
  adjusted_received_amount?: number;
  fees_paid_amount?: number;
  updated: string;
  created: string;
  currency: string;
  payment_channel?: string;
  payment_destination?: string;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  bookingId: string;
  action: string;
  actor: AuditActor;
  details: Record<string, unknown>;
  timestamp: string;
}

// ─── Flight Search Cache ─────────────────────────────────────────────────────

export interface FlightSearchRecord {
  id: string;
  sessionId: string;
  origin: string;
  destination: string;
  departureDate: string;
  results: FlightResult[];
  source: FlightSource;
  createdAt: string;
}

// ─── Admin Verify ────────────────────────────────────────────────────────────

export interface VerifyRequest {
  bookingId: string;
  action: AdminAction;
  adminId: string;
  reason?: string;
}

export interface VerifyResponse {
  bookingId: string;
  previousStatus: BookingStatus;
  newStatus: BookingStatus;
  action: AdminAction;
  timestamp: string;
}

// ─── AI Chat Types ───────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "function";
  content: string;
  name?: string;        // function name when role is "function"
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface ChatRequest {
  messages: ChatMessage[];
  sessionId?: string;
  language?: Language;
}

export interface ChatResponse {
  reply: string;
  lang: Language;
  detectedLang: Language;
  functionCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
  provider: string;
}

// ─── Function Calling Definitions ────────────────────────────────────────────

export interface FunctionDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

// ─── Passport Validation ─────────────────────────────────────────────────────

export interface PassportValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  extractedData: {
    name?: string;
    passportNumber?: string;
    expiryDate?: string;
    nationality?: string;
    dateOfBirth?: string;
  };
  needsVerify: boolean;
}

// ─── Iron Rule Violation ─────────────────────────────────────────────────────

export interface IronRuleViolation {
  rule: "NO_CREDIT_CARD_STORAGE" | "NO_PDF_EDITING" | "NO_AUTO_REFUND" | "NO_STATIC_PRICES";
  severity: "BLOCK" | "WARN";
  message: string;
  context?: string;
}
