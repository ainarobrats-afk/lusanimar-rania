import { useState, useRef, useCallback, useEffect } from "react";

const API = "/api";

interface PassportData {
  full_name?: string;
  surname?: string;
  given_names?: string;
  passport_number?: string;
  nationality?: string;
  date_of_birth?: string;
  expiry_date?: string;
  gender?: string;
}

interface Props {
  lang: "tet" | "id" | "en" | "pt";
  onData: (data: PassportData) => void;
  onClose: () => void;
}

const LABELS: Record<string, Record<string, string>> = {
  tet: { title: "Skanu Pasaporte", align: "Tau pasaporte iha kaixa laran", capture: "Kaptura", processing: "Analiza...", success: "Dadus extrai!", retry: "Tenta Fila" },
  id: { title: "Scan Paspor", align: "Tempatkan paspor di dalam kotak", capture: "Ambil Foto", processing: "Memproses...", success: "Data berhasil dibaca!", retry: "Coba Lagi" },
  en: { title: "Scan Passport", align: "Align passport within the frame", capture: "Capture", processing: "Processing...", success: "Data extracted!", retry: "Retry" },
  pt: { title: "Digitalizar Passaporte", align: "Coloque o passaporte na moldura", capture: "Capturar", processing: "A processar...", success: "Dados extraídos!", retry: "Tentar Novamente" },
};

// Parse MRZ (Machine Readable Zone) from text
function parseMRZ(text: string): PassportData | null {
  // MRZ line 2: 9-char passport no + check + 3-char nationality + 6-char DOB + check + M/F/< + 6-char expiry + check + ...
  const mrzLine2 = text.match(/([A-Z0-9<]{9})(\d)([A-Z]{3})(\d{6})(\d)([MF<])(\d{6})(\d)/);
  const mrzLine1 = text.match(/P<([A-Z]{3})([A-Z<]+)<<([A-Z<]+)/);
  
  if (!mrzLine2 && !mrzLine1) return null;
  
  const result: PassportData = {};
  if (mrzLine1) {
    result.nationality = mrzLine1[1];
    result.surname = mrzLine1[2].replace(/</g, " ").trim();
    result.given_names = mrzLine1[3].replace(/</g, " ").trim();
    result.full_name = `${result.given_names} ${result.surname}`.trim();
  }
  if (mrzLine2) {
    result.passport_number = mrzLine2[1].replace(/</g, "").trim();
    if (!result.nationality) result.nationality = mrzLine2[3];
    const dob = mrzLine2[4];
    result.date_of_birth = `${dob.substring(0, 2)}/${dob.substring(2, 4)}/${dob.substring(4, 6)}`;
    const exp = mrzLine2[7];
    result.expiry_date = `${exp.substring(0, 2)}/${exp.substring(2, 4)}/${exp.substring(4, 6)}`;
    result.gender = mrzLine2[6] === "M" ? "Male" : mrzLine2[6] === "F" ? "Female" : "Unknown";
  }
  return result;
}

export default function PassportCamera({ lang, onData, onClose }: Props) {
  const L = LABELS[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "capturing" | "processing" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [extractedData, setExtractedData] = useState<PassportData | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
    startCamera();
    return () => { stopCamera(); };
  }, []);

  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: isMobile ? "environment" : "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStatus("ready");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Camera not available");
      setStatus("error");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || status !== "ready") return;
    setStatus("capturing");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const imageBase64 = canvas.toDataURL("image/jpeg", 0.85);
    setStatus("processing");

    try {
      const res = await fetch(`${API}/rania/passport-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setExtractedData(data.data);
          setStatus("success");
          setTimeout(() => {
            stopCamera();
            onData(data.data);
          }, 1800);
        } else {
          // Fallback: try MRZ parse from raw text
          const mrzData = parseMRZ(data.raw || "");
          if (mrzData && (mrzData.passport_number || mrzData.full_name)) {
            setExtractedData(mrzData);
            setStatus("success");
            setTimeout(() => { stopCamera(); onData(mrzData); }, 1800);
          } else {
            setErrorMsg(lang === "id" ? "Tidak bisa membaca paspor, coba lagi" : "Could not read passport, try again");
            setStatus("error");
          }
        }
      } else {
        setErrorMsg("Scan failed. Try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Try again.");
      setStatus("error");
    }
  }, [status, lang, onData]);

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center bg-black/90 backdrop-blur-md" style={{ animation: "chatSlideUp 0.3s ease" }}>
      <div className="w-full max-w-md bg-[#03060f] border-t border-cyan-400/20 rounded-t-3xl overflow-hidden" style={{ maxHeight: "92vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl rania-gradient-btn flex items-center justify-center text-base">📷</div>
            <div>
              <div className="text-sm font-black text-white">{L.title}</div>
              <div className="text-[10px] text-cyan-400">RANIA AI Passport OCR</div>
            </div>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }}
            className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
          {/* Video */}
          <video ref={videoRef} autoPlay playsInline muted
            className="w-full h-full object-cover"
            style={{ display: status === "error" ? "none" : "block" }} />

          {/* Passport guide overlay */}
          {status === "ready" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Dark overlay around guide */}
              <div className="absolute inset-0 bg-black/45" />
              {/* Guide rectangle */}
              <div className="relative z-10 rounded-2xl"
                style={{ width: "82%", height: "58%", border: "2.5px solid rgba(0,229,255,0.9)", boxShadow: "0 0 0 9999px rgba(0,0,0,0.5), 0 0 30px rgba(0,229,255,0.4)" }}>
                {/* Corner markers */}
                {[["top-0 left-0", "rounded-tl-2xl"], ["top-0 right-0", "rounded-tr-2xl"], ["bottom-0 left-0", "rounded-bl-2xl"], ["bottom-0 right-0", "rounded-br-2xl"]].map(([pos, r], i) => (
                  <div key={i} className={`absolute ${pos} w-6 h-6 border-[3px] border-cyan-400 ${r}`}
                    style={{ boxSizing: "border-box", borderRight: i % 2 === 0 ? "none" : undefined, borderLeft: i % 2 === 1 ? "none" : undefined, borderBottom: i < 2 ? "none" : undefined, borderTop: i >= 2 ? "none" : undefined }} />
                ))}
                {/* Scan line */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"
                  style={{ animation: "scanLine 2s linear infinite", top: "50%" }} />
                {/* MRZ indicator */}
                <div className="absolute bottom-1 left-2 right-2 h-6 border border-dashed border-cyan-400/40 rounded flex items-center justify-center">
                  <span className="text-[8px] text-cyan-400/60 font-mono tracking-widest">MRZ ZONE</span>
                </div>
              </div>
              <div className="absolute bottom-6 text-xs text-white/80 text-center px-6">{L.align}</div>
            </div>
          )}

          {/* Processing overlay */}
          {status === "processing" && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 border-3 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" style={{ borderWidth: 3 }} />
              <div className="text-sm text-cyan-400 font-semibold">{L.processing}</div>
              <div className="text-[11px] text-gray-400">RANIA AI Vision is reading your passport...</div>
            </div>
          )}

          {/* Success overlay */}
          {status === "success" && (
            <div className="absolute inset-0 bg-emerald-900/80 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl animate-bounce">✅</div>
              <div className="text-sm text-emerald-400 font-bold">{L.success}</div>
              {extractedData?.full_name && (
                <div className="text-xs text-white/80 bg-black/30 rounded-xl px-4 py-2 text-center">
                  {extractedData.full_name}
                  {extractedData.passport_number && <><br /><span className="font-mono text-cyan-400">{extractedData.passport_number}</span></>}
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4 p-6">
              <div className="text-4xl">📷</div>
              <div className="text-sm text-red-400 text-center">{errorMsg}</div>
              <button onClick={() => { setStatus("loading"); setErrorMsg(""); startCamera(); }}
                className="px-4 py-2 rounded-xl rania-gradient-btn text-black text-xs font-bold">{L.retry}</button>
            </div>
          )}

          {/* Loading */}
          {status === "loading" && (
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-t-cyan-400 border-cyan-400/20 rounded-full animate-spin" />
            </div>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="px-5 py-5 flex gap-3">
          <button onClick={() => { stopCamera(); onClose(); }}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm font-semibold hover:bg-white/8 transition-all">
            {lang === "id" ? "Batal" : lang === "en" ? "Cancel" : lang === "pt" ? "Cancelar" : "Kansela"}
          </button>
          <button onClick={captureAndScan}
            disabled={status !== "ready"}
            className="flex-[2] py-3 rounded-xl rania-gradient-btn text-black text-sm font-black hover:scale-105 transition-all disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-2">
            <span>📷</span> {L.capture}
          </button>
        </div>

        {/* Hint */}
        <div className="pb-6 text-center text-[10px] text-gray-600 px-6">
          {lang === "id" ? "Foto halaman data paspor (bukan cover). RANIA isi otomatis." :
           lang === "en" ? "Photo the passport data page (not cover). RANIA auto-fills." :
           lang === "pt" ? "Fotografe a página de dados (não a capa). RANIA preenche automaticamente." :
           "Foto págiña dadus pasaporte (la'ós kapa). RANIA atu preenxe otomatiku."}
        </div>
      </div>

      {/* Inline keyframe for scan animation */}
      <style>{`
        @keyframes scanLine { 0% { top: 10%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 90%; opacity: 0; } }
      `}</style>
    </div>
  );
}
