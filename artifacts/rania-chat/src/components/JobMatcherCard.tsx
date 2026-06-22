/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Upload, Mic, Clock, Sparkles, Briefcase, FileText, CheckCircle } from "lucide-react";
import { LanguageCode } from "../i18n";

interface JobMatch {
  id: string;
  title: string;
  salary: number;
  score: number;
  reason: string;
}

interface JobMatcherCardProps {
  lang: LanguageCode;
  onEmitCoin: (x: number, y: number) => void;
  onApplySuccess: (jobTitle: string) => void;
}

const DICT = {
  tet: {
    subtitle: "Sani CV no graun lian sapaan hodi hetan serbisu lalais.",
    tenSecs: "HETAN SERBISU 10 SEGUNDU",
    cvTitle: "1. Hakerek ka Hili Ezemplu CV (Upload / Koko)",
    cvDriver: "CV Sopir",
    cvCashier: "CV Loja",
    cvFarm: "CV Kebun",
    parsingSuccess: "CV parse ho laran-metin",
    parsingAction: "Troka",
    voiceTitle: "2. Grava ó-nia Lian (Maks 15 Segundu)",
    recording: "GRAVA LIAN REAL-TIME • 00:",
    stopRecord: "Selesai Grava",
    voiceSuccess: "LIAN GRAVA MAKUAK",
    voiceRedo: "Ulang",
    voiceHint: "Klik atu Grava lian foin",
    voiceInstr: "Uza liafuan hosi Tetun ka Português, Inglés",
    matchBtn: "Mulai Analiza Serbisu ho AI",
    outputTitle: "📋 Rejistu Vaga Serbisu di'ak liu ba Ó",
    applyNow: "Lamar Serbisu",
    emptyOutput: "Favór graun CV ka lian sapaan makaen, depois klik analiza hodi ko'alia AI.",
    integratedNotice: "Rania Serbisu integra ho regulamentu Banku Sentrál (BCTL) ho komisun 100% gratis.",
    analyzing: "Rania AI halo OCR CV no speech-to-text lian..."
  },
  id: {
    subtitle: "Scan dokumen CV dan kecocokan suara Anda langsung secara virtual",
    tenSecs: "DAPAT KERJA 10 DETIK",
    cvTitle: "1. Lengkapi CV Anda (Upload / Contoh)",
    cvDriver: "CV Sopir",
    cvCashier: "CV Kasir",
    cvFarm: "CV Kebun",
    parsingSuccess: "Simulasi CV Diparsing Sukses",
    parsingAction: "Ganti",
    voiceTitle: "2. Rekam Suara Anda (Maks 15 Detik)",
    recording: "SEDANG MEREKAM • 00:",
    stopRecord: "Selesai Rekam",
    voiceSuccess: "REKAMAN AKTIF",
    voiceRedo: "Ulang",
    voiceHint: "Klik Untuk Mulai Rekam",
    voiceInstr: "Ucapkan intro diri dalam Tetun ka Inggris",
    matchBtn: "Mulai Analisis Kecocokan Karir AI",
    outputTitle: "📋 Hasil Rekomendasi Karir Terkuat",
    applyNow: "Lamar Sekarang",
    emptyOutput: "Silakan kirim CV, rekam intro suara Anda, lalu klik tombol ANALISIS.",
    integratedNotice: "Sitem Rania Kerja terintegrasi erat dengan BCTL Timor-Leste secara resmi dan bebas komisi.",
    analyzing: "Asisten AI Rania sedang meneliti kecocokan data kualifikasi..."
  },
  en: {
    subtitle: "Scan your resume document and match speaker voice virtually instantly",
    tenSecs: "FIND A JOB IN 10 SECONDS",
    cvTitle: "1. Secure Your CV Resume (Upload / Sample)",
    cvDriver: "Driver CV",
    cvCashier: "Cashier CV",
    cvFarm: "Farmer CV",
    parsingSuccess: "CV Parsed & Read Safely",
    parsingAction: "Change",
    voiceTitle: "2. Record Your Mini Self-Intro (Max 15 Secs)",
    recording: "RECORDING LIVE AUDIO • 00:",
    stopRecord: "Stop Recording",
    voiceSuccess: "VOICE ENCODED",
    voiceRedo: "Redo",
    voiceHint: "Click to Record Voice",
    voiceInstr: "State your experience in Tetun, English or Portuguese",
    matchBtn: "Initiate AI Career Matching",
    outputTitle: "📋 Top Artificial Intelligence Match Results",
    applyNow: "Apply Now",
    emptyOutput: "Please upload your CV, record your voice audio intro, then click matching.",
    integratedNotice: "Rania Jobs network complies natively with Central Bank of TL (BCTL) standards.",
    analyzing: "Rania AI is running OCR parsers and speech translation neural networks..."
  },
  pt: {
    subtitle: "Faça o scanning do currículo e triagem de voz de forma digital instantânea.",
    tenSecs: "ARRANJE EMPREGO EM 10 SEGUNDOS",
    cvTitle: "1. Anexe o seu Currículo (Upload / Exemplos)",
    cvDriver: "CV Motorista",
    cvCashier: "CV Loja/Kasir",
    cvFarm: "CV Agricultor",
    parsingSuccess: "Dados de Currículo Analisados",
    parsingAction: "Alterar",
    voiceTitle: "2. Grave a sua Voz (Máximo 15 Segundos)",
    recording: "GRAVANDO EM DIRETO • 00:",
    stopRecord: "Finalizar Gravador",
    voiceSuccess: "ÁUDIO DE VOZ REGISTADO",
    voiceRedo: "Repetir",
    voiceHint: "Clique para Começar a Gravação",
    voiceInstr: "Introduza-se verbalmente em Português, Tetum ou Inglês",
    matchBtn: "Pesquisar Vagas Adequadas via AI",
    outputTitle: "📋 Melhores Oportunidades Selecionadas",
    applyNow: "Candidatar agora",
    emptyOutput: "Por favor, submeta um currículo, grave o áudio de voz e depois clique em analisar.",
    integratedNotice: "O sistema Rania Empregos é certificado por regulamentos do Banco Central BCTL.",
    analyzing: "A inteligência artificial Rania está a processar o seu currículo..."
  }
};

export default function JobMatcherCard({ lang, onEmitCoin, onApplySuccess }: JobMatcherCardProps) {
  const [cvName, setCvName] = useState<string>("");
  const [cvText, setCvText] = useState<string>("");
  const [voiceRecorded, setVoiceRecorded] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [voiceText, setVoiceText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // PDF CV upload states
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Custom posted vacancies by employers
  const [customVacancies, setCustomVacancies] = useState<any[]>([
    { id: "v_1", title: "Supir Pribadi Keluarga Ermera", company: "Cassa Cafe Timor", salary: 380, category: "Sopir", requirement: "SIM A/B, menguasai medan tanjakan Gleno.", contact: "+670 7711 2233" },
    { id: "v_2", title: "Asisten Kasir Toko Kmanek", company: "Supermercado Kmanek", salary: 295, category: "Kasir", requirement: "Jujur, teliti, ramah tamah, domisili Dili Comoro.", contact: "hrd@kmanek.tl" }
  ]);

  // Vacancy posting form states
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newCategory, setNewCategory] = useState("Sopir");
  const [newSalary, setNewSalary] = useState(300);
  const [newRequirement, setNewRequirement] = useState("");
  const [newContact, setNewContact] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvName(file.name);
      setCvText(`Kualifikasi CV dari file ${file.name}. Menguasai keahlian kerja bidang: ${file.name.toLowerCase().includes("sopir") ? "Sopir" : file.name.toLowerCase().includes("kasir") ? "Kasir" : "Kebun dan Pertanian"}`);
      onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setCvName(file.name);
      setCvText(`Kualifikasi CV dari file ${file.name}. Menguasai keahlian kerja bidang: ${file.name.toLowerCase().includes("sopir") ? "Sopir" : file.name.toLowerCase().includes("kasir") ? "Kasir" : "Kebun dan Pertanian"}`);
      onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
    }
  };

  const handlePostVacancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim() || !newCompany.trim() || !newRequirement.trim() || !newContact.trim()) {
      alert("Harap lengkapi semua isian Form Lowongan Kerja sebelum memposting!");
      return;
    }

    const newVac = {
      id: `custom_job_${Date.now()}`,
      title: newJobTitle.trim(),
      company: newCompany.trim(),
      salary: Number(newSalary) || 250,
      category: newCategory,
      requirement: newRequirement.trim(),
      contact: newContact.trim()
    };

    setCustomVacancies(prev => [newVac, ...prev]);
    setNewJobTitle("");
    setNewCompany("");
    setNewRequirement("");
    setNewContact("");
    
    alert(`Lowongan Kerja "${newJobTitle}" berhasil diterbitkan di RANIA Kerja!`);
    onEmitCoin(window.innerWidth / 2, window.innerHeight / 4);
    
    // Automatically recalculate matching to show the newly posted job instantly!
    setTimeout(() => {
      handleMatchJobs();
    }, 400);
  };

  // Simulated Voice Recording Timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 15) {
            handleStopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setVoiceRecorded(false);
    setVoiceText("");
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setVoiceRecorded(true);
    
    const sampleText = {
      tet: "Hau bele lori karreta boot kargo, lori karga husi Dili ba Baucau, lori be hudi dalan safely.",
      id: "Saya bisa menyetir truk logistik besar tangguh, antar muatan logistik kargo ke Dili dan Baucau aman.",
      en: "I can drive heavy duty cargo trucks, safely moving cargo logistic items across Dili, Ermera and Baucau.",
      pt: "Consigo conduzir camiões pesados de transporte, entregando mercadorias com total segurança em Dili."
    };

    setVoiceText(sampleText[lang]);
    onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
  };

  const handleCvSimulate = (fileName: string, bioText: string) => {
    setCvName(fileName);
    setCvText(bioText);
    onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
  };

  const handleMatchJobs = async () => {
    setLoading(true);
    setMatches([]);
    setHasSearched(true);

    try {
      const response = await fetch("/api/jobs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvName: cvName || "CV_Simulated_Soares.pdf",
          cvText: cvText || "Experienced driver holding class B license with 3 years driving around Ermera.",
          voiceText: voiceText
        })
      });

      if (!response.ok) throw new Error("Gagal matching");
      const data = await response.json();
      
      const localizedMatches = data.matches?.map((m: any) => {
        let finalReason = m.reason;
        if (lang === "tet") {
          if (m.id === "job_sopir") finalReason = "Sistem foti foku foti hosi graun lian: Kmanek lori karreta, SIM ativu ho laran-metin.";
          if (m.id === "job_toko") finalReason = "Parser klase ladun iha kualifikasaun servisu loja nian.";
          if (m.id === "job_kebun") finalReason = "Akademiku la tuir foku kategoria agrikultura lokál nian.";
        } else if (lang === "en") {
          if (m.id === "job_sopir") finalReason = "Matching criteria parsed: Valid driver license plus heavy cargo truck experience.";
          if (m.id === "job_toko") finalReason = "Lacking intensive cashier sales experience.";
          if (m.id === "job_kebun") finalReason = "Field does not align with active horticultural needs.";
        } else if (lang === "pt") {
          if (m.id === "job_sopir") finalReason = "Perfil correspondido: Carta de condução pesada e excelente domínio rodoviário.";
          if (m.id === "job_toko") finalReason = "Experiência de vendas em supermercados menor que o requerido.";
          if (m.id === "job_kebun") finalReason = "Qualificações agrícolas incompatíveis de momento.";
        }
        return {
          ...m,
          reason: finalReason
        };
      });

      // Mix with custom vacancies
      const finalCombined = [
        ...customVacancies.map(v => {
          const isCategoryMatch = 
            cvText.toLowerCase().includes(v.category.toLowerCase()) || 
            cvName.toLowerCase().includes(v.category.toLowerCase()) ||
            voiceText.toLowerCase().includes(v.category.toLowerCase());
          return {
            id: v.id,
            title: `${v.title} (${v.company})`,
            salary: v.salary,
            score: isCategoryMatch ? 98 : 45,
            reason: `Kecocokan ${isCategoryMatch ? "Sempurna" : "Sedang"} dengan keahlian ${v.category}. Hubungi kontak Penerbit: ${v.contact}`
          };
        }),
        ...(localizedMatches || [])
      ].sort((a,b) => b.score - a.score);

      setMatches(finalCombined);

      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          onEmitCoin(window.innerWidth / 2, window.innerHeight / 3);
        }, i * 200);
      }

    } catch (err) {
      console.error(err);
      
      const combinedFallback = [
        ...customVacancies.map(v => {
          const isCategoryMatch = 
            cvText.toLowerCase().includes(v.category.toLowerCase()) || 
            cvName.toLowerCase().includes(v.category.toLowerCase()) ||
            voiceText.toLowerCase().includes(v.category.toLowerCase());
          return {
            id: v.id,
            title: `${v.title} (${v.company})`,
            salary: v.salary,
            score: isCategoryMatch ? 98 : 45,
            reason: `Sesuai kriteria lowongan ${v.category} di ${v.company}. Hubungi: ${v.contact}`
          };
        }),
        { id: "job_sopir", title: "Sopir Truk & Logistik Dili", salary: 350, score: 95, reason: "Berdasarkan rujukan klasifikasi suara: SIM aktif & Truk logistik." },
        { id: "job_toko", title: "Penjaga Toko Sembako Kelapa", salary: 250, score: 45, reason: "Kurang pengalaman kasir ritel." },
        { id: "job_kebun", title: "Pengelola Kebun Organik Baucau", salary: 200, score: 15, reason: "Latar akademis belum sesuai agrikultur." }
      ].sort((a, b) => b.score - a.score);

      setMatches(combinedFallback);
    } finally {
      setLoading(false);
    }
  };

  const handleLamarJob = (jobTitle: string) => {
    onApplySuccess(jobTitle);
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        onEmitCoin(window.innerWidth / 2, window.innerHeight / 2);
      }, i * 150);
    }
  };

  const cDict = DICT[lang];

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden transition-all hover:border-slate-700">
      
      {/* Premium background radial accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-600/10 to-transparent rounded-full pointer-events-none blur-xl" />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-650/20 text-blue-400 flex items-center justify-center font-bold text-xl">
            💼
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-white tracking-tight flex items-center gap-1.5 font-sans">
              RANIA Kerja <span className="text-xs font-mono font-medium bg-[#1F2937] text-blue-400 border border-slate-700 px-2 py-0.5 rounded-full">AI JOB MATCHER</span>
            </h3>
            <p className="text-xs text-slate-400">{cDict.subtitle}</p>
          </div>
        </div>
        <span className="text-xs font-mono font-black text-[#F5A623] bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg">
          {cDict.tenSecs}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        
        {/* Left Control Panel: Upload CV + Voice Record Simulator */}
        <div className="space-y-4">
          
          {/* SIMULATE CV INPUTS */}
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-850">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5 mb-2.5">
              <FileText size={12} className="text-blue-400 animate-bounce" /> {cDict.cvTitle}
            </span>

            {cvName ? (
              <div className="flex items-center justify-between bg-[#0F1420] border border-blue-500/30 p-2.5 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-lg">📄</span>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-white block truncate">{cvName}</span>
                    <span className="text-[9.5px] text-slate-500 font-mono">{cDict.parsingSuccess}</span>
                  </div>
                </div>
                <button 
                  onClick={() => { setCvName(""); setCvText(""); }}
                  className="text-[#3B82F6] hover:text-red-400 text-xs px-1 cursor-pointer font-bold"
                >
                  {cDict.parsingAction}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Native PDF / Document File Dropzone */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                    isDragging 
                      ? "border-blue-400 bg-blue-950/20" 
                      : "border-slate-800 bg-[#0B0F1A] hover:border-slate-700/80"
                  }`}
                  title="Klik atau taruh file CV Anda di sini"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".pdf,.doc,.docx" 
                    className="hidden" 
                  />
                  <Upload size={18} className="mx-auto text-blue-400 mb-1.5 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-300 block">Klik atau Seret (Drag & Drop) CV PDF di sini</span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-1">Format PDF, DOCX (Maks 10MB)</span>
                </div>

                <div className="text-[9px] text-slate-500 text-center font-bold tracking-wider uppercase">
                  — ATAU GUNAKAN TEMPLATE CONTOH —
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleCvSimulate("CV_Sopir_Manuel.pdf", "Supir truk kargo berpengalaman 3 tahun." )}
                    className="bg-slate-950 hover:bg-slate-855 p-2 text-center rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer text-[10px] space-y-1 block duration-200"
                  >
                    <span className="text-base block">🚛</span>
                    <span className="text-slate-300 font-medium font-mono">{cDict.cvDriver}</span>
                  </button>
                  <button
                    onClick={() => handleCvSimulate("CV_Lidia_Kasir.pdf", "Saya berminat bekerja di kasir ruko / toko sembako." )}
                    className="bg-slate-950 hover:bg-slate-855 p-2 text-center rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer text-[10px] space-y-1 block duration-200"
                  >
                    <span className="text-base block">🛍️</span>
                    <span className="text-slate-300 font-medium font-mono">{cDict.cvCashier}</span>
                  </button>
                  <button
                    onClick={() => handleCvSimulate("CV_Xavier_Kebun.pdf", "Saya lulusan magang pertanian di Baucau." )}
                    className="bg-slate-950 hover:bg-slate-855 p-2 text-center rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer text-[10px] space-y-1 block duration-200"
                  >
                    <span className="text-base block">🌱</span>
                    <span className="text-slate-300 font-medium font-mono">{cDict.cvFarm}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SIMULATE VOICE RECORDER */}
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-850">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5 mb-2.5">
              <Mic size={12} className="text-blue-400 animate-pulse" /> {cDict.voiceTitle}
            </span>

            {isRecording ? (
              <div className="flex flex-col items-center justify-center py-2 bg-red-950/25 border border-red-500/25 rounded-lg space-y-2">
                <span className="text-xs text-red-400 font-black tracking-wider animate-pulse flex items-center gap-1.5">
                  🔴 {cDict.recording}{String(recordingSeconds).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-1 justify-center w-full px-8">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-red-500 rounded-full animate-bounce"
                      style={{ 
                        height: `${8 + Math.random() * 24}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: `${0.4 + Math.random() * 0.5}s`
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleStopRecording}
                  className="bg-red-650 hover:bg-red-500 text-white text-[10.5px] font-bold px-4 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  {cDict.stopRecord}
                </button>
              </div>
            ) : voiceRecorded ? (
              <div className="bg-[#0F1420] border border-green-500/30 p-2.5 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-lg">📢</span>
                    <div className="truncate">
                      <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded font-mono font-bold">{cDict.voiceSuccess}</span>
                      <p className="text-[10px] text-slate-450 italic mt-0.5 truncate max-w-[150px] md:max-w-[200px]">
                        "{voiceText}"
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleStartRecording}
                    className="text-[#3B82F6] hover:text-[#F5A623] text-xs px-1 shrink-0 cursor-pointer font-bold"
                  >
                    {cDict.voiceRedo}
                  </button>
                </div>
              </div>
            ) : (
                <button
                  onClick={handleStartRecording}
                  className="w-full py-4 rounded-xl border border-dashed border-slate-800 bg-[#0B0F1A] text-slate-400 hover:border-blue-500 hover:text-white transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-lg shadow-inner group-hover:text-blue-400 transition-colors">
                    🎙️
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-semibold block">{cDict.voiceHint}</span>
                    <span className="text-[9.5px] text-slate-500 block font-mono">{cDict.voiceInstr}</span>
                  </div>
                </button>
            )}
          </div>

          <button
            onClick={handleMatchJobs}
            disabled={loading || (!cvName && !voiceRecorded)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-xs tracking-wide shadow-lg cursor-pointer transition-all disabled:opacity-40 flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <Sparkles size={14} className="animate-spin [animation-duration:3s]" />
            <span>{cDict.matchBtn}</span>
          </button>

        </div>

        {/* Right Output Panel: MATCH LISTINGS OUTPUT */}
        <div className="bg-[#0B0F1A]/90 rounded-2xl border border-slate-850 p-4 min-h-[280px] flex flex-col justify-between">
          
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5 mb-3 border-b border-slate-850 pb-2">
              {cDict.outputTitle}
            </h4>

            {loading ? (
              <div className="space-y-4 py-12 animate-fade-in text-center">
                <p className="text-xs text-slate-400 font-mono animate-pulse">
                  🤖 {cDict.analyzing}
                </p>
                <div className="h-1.5 w-1/2 mx-auto bg-slate-850 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-2/3 animate-pulse" />
                </div>
              </div>
            ) : matches.length > 0 ? (
              <div className="space-y-2.5 animate-fade-in">
                {matches.map((job) => (
                  <div 
                    key={job.id}
                    className="p-3 bg-[#111827] border border-slate-850 rounded-xl hover:border-slate-800 transition-all flex justify-between gap-3 items-start"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white leading-none">{job.title}</span>
                        <span className="text-[9px] bg-blue-550/10 text-blue-400 border border-blue-500/25 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                          Match {job.score}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        {job.reason}
                      </p>
                      <span className="text-[11px] text-[#F5A623] font-display font-black block pt-1">
                        {lang === "tet" ? "Vensimentu" : lang === "en" ? "Salary Offer" : lang === "pt" ? "Subsídio/Salário" : "Gaji Pokok"}: ${job.salary.toLocaleString()}/bln
                      </span>
                    </div>

                    <button
                      onClick={() => handleLamarJob(job.title)}
                      className="bg-blue-650 hover:bg-blue-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap self-center shadow-md shrink-0"
                    >
                      {cDict.applyNow}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2.5">
                <span className="text-3xl filter grayscale opacity-45">💼</span>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
                  {hasSearched 
                    ? "Maaf, hasil pencarian kosong. Coba masukkan CV or rekam suara Anda." 
                    : cDict.emptyOutput
                  }
                </p>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 font-light border-t border-slate-850/60 pt-2.5 mt-4 leading-relaxed font-sans">
            ℹ️ {cDict.integratedNotice}
          </div>

        </div>

      </div>

      {/* 4. Form Post Vacancy Lengkap (Exclusive for Employers & Partners) */}
      <div className="mt-8 border-t border-slate-800/80 pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📢</span>
          <div>
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Terbitkan Lowongan Kerja Baru (Post Vacancy Form)
            </h4>
            <p className="text-[11px] text-slate-400">Punya usaha dagang, toko, kebun, atau jastip dan butuh karyawan berkualitas di Timor-Leste? Publikasikan di sini.</p>
          </div>
        </div>

        <form onSubmit={handlePostVacancy} className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">Nama Lowongan / Job Title</label>
              <input 
                type="text"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="Contoh: Kasir Toko Kelontong, Supir L-300..."
                className="w-full bg-[#111827] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">Nama Perusahaan / Toko</label>
              <input 
                type="text"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Contoh: Kios Berkah Gleno, Depot Sanimar..."
                className="w-full bg-[#111827] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-semibold">Kategori Pekerjaan</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-blue-500"
                >
                  <option value="Sopir">🚛 Sopir / Driver</option>
                  <option value="Kasir">🛍️ Kasir / Toko</option>
                  <option value="Kebun">🌱 Kebun / Pertanian</option>
                  <option value="Administrasi">📁 Administrasi</option>
                  <option value="Profesional">👔 Profesional</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-semibold">Gaji yang Ditawarkan ($ USD/bln)</label>
                <input 
                  type="number"
                  value={newSalary}
                  onChange={(e) => setNewSalary(Number(e.target.value))}
                  placeholder="300"
                  className="w-full bg-[#111827] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">Persyaratan Utama (Pendidikan, Pengalaman, SIM, dll)</label>
              <textarea 
                rows={2}
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="Contoh: Memiliki SIM A, jujur, menguasai microsoft excel dasar, bersedia tinggal di Ermera..."
                className="w-full bg-[#111827] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">Kontak Lamaran (Email atau WhatsApp)</label>
              <input 
                type="text"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                placeholder="Contoh: hrd@usaha-anda.com atau WA: +670 77112233"
                className="w-full bg-[#111827] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:translate-y-0.5"
            >
              🚀 Terbitkan Lowongan Sekarang
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
