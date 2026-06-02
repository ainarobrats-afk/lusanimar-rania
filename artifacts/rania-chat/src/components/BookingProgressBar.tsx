interface Step {
  key: string;
  label: string;
  icon: string;
}

interface BookingProgressBarProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  lang: "tet" | "id" | "en" | "pt";
  variant?: "compact" | "full";
}

const STEPS_BY_LANG = {
  en: [
    { key: "search", label: "Search", icon: "🔍" },
    { key: "select", label: "Select", icon: "✈" },
    { key: "details", label: "Details", icon: "📋" },
    { key: "payment", label: "Payment", icon: "💳" },
    { key: "confirm", label: "Done", icon: "✅" },
  ],
  id: [
    { key: "search", label: "Cari", icon: "🔍" },
    { key: "select", label: "Pilih", icon: "✈" },
    { key: "details", label: "Data", icon: "📋" },
    { key: "payment", label: "Bayar", icon: "💳" },
    { key: "confirm", label: "Selesai", icon: "✅" },
  ],
  tet: [
    { key: "search", label: "Buka", icon: "🔍" },
    { key: "select", label: "Hili", icon: "✈" },
    { key: "details", label: "Dadus", icon: "📋" },
    { key: "payment", label: "Selu", icon: "💳" },
    { key: "confirm", label: "Remata", icon: "✅" },
  ],
  pt: [
    { key: "search", label: "Buscar", icon: "🔍" },
    { key: "select", label: "Escolher", icon: "✈" },
    { key: "details", label: "Dados", icon: "📋" },
    { key: "payment", label: "Pagar", icon: "💳" },
    { key: "confirm", label: "Concluído", icon: "✅" },
  ],
};

export default function BookingProgressBar({ currentStep, lang, variant = "compact" }: BookingProgressBarProps) {
  const steps: Step[] = STEPS_BY_LANG[lang] || STEPS_BY_LANG.en;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1 py-2 px-3 bg-black/30 border border-white/10 rounded-xl">
        {steps.map((step, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          return (
            <div key={step.key} className="flex items-center gap-1">
              <div className={`flex items-center gap-1 ${isActive ? "opacity-100" : isDone ? "opacity-70" : "opacity-30"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all
                  ${isDone ? "bg-emerald-500 text-white" : isActive ? "bg-cyan-500 text-white ring-2 ring-cyan-400/50" : "bg-white/10 text-gray-400"}`}>
                  {isDone ? "✓" : stepNum}
                </div>
                <span className={`text-[9px] font-medium hidden sm:block ${isActive ? "text-cyan-400" : isDone ? "text-emerald-400" : "text-gray-500"}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-[1px] w-3 sm:w-4 rounded-full transition-all ${stepNum < currentStep ? "bg-emerald-500" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
        <span className="ml-auto text-[9px] text-gray-400">{currentStep}/{steps.length}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${isDone ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                  isActive ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 ring-4 ring-cyan-400/20" :
                  "bg-white/10 text-gray-500"}`}>
                {isDone ? "✓" : step.icon}
              </div>
              <span className={`text-[10px] font-semibold text-center leading-tight ${isActive ? "text-cyan-400" : isDone ? "text-emerald-400" : "text-gray-500"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
