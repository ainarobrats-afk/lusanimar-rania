import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retries: number;
}

/**
 * RANIA Global Error Boundary
 * • No blank screens
 * • No state clearing on error
 * • Lightweight retry button
 * • Never exposes stack traces to users
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retries: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log internally, never expose to user
    if (typeof console !== "undefined") {
      // Only log in development
      if (import.meta.env.DEV) {
        console.error("[RANIA ErrorBoundary]", error, info.componentStack);
      }
    }
  }

  handleRetry = () => {
    this.setState((s) => ({ hasError: false, error: null, retries: s.retries + 1 }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050812",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 360,
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "28px 24px",
            textAlign: "center",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg,#00e5ff22,#7c3aed22)",
              border: "1px solid rgba(0,229,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              margin: "0 auto 16px",
            }}
          >
            ✈️
          </div>

          <div style={{ color: "#00e5ff", fontSize: 15, fontWeight: 800, marginBottom: 8 }}>
            RANIA mengalami gangguan kecil
          </div>
          <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 20, lineHeight: 1.6 }}>
            Jangan khawatir — data Anda aman.<br />
            Chat dan booking Anda tersimpan otomatis.
          </div>

          <button
            onClick={this.handleRetry}
            style={{
              width: "100%",
              padding: "12px 20px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg,#00e5ff,#7c3aed)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 10,
            }}
          >
            🔄 Coba Lagi
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              width: "100%",
              padding: "10px 20px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "#6b7280",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Reload halaman
          </button>

          {this.state.retries > 0 && (
            <div style={{ color: "#fb923c", fontSize: 11, marginTop: 12 }}>
              Masalah berlanjut? Hubungi SANIMAR via WhatsApp.
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
