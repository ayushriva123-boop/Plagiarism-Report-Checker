import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, ChevronRight, Activity, ShieldAlert, Cpu } from "lucide-react";

interface Step {
  id: number;
  label: string;
  sub: string;
}

const STEPS: Step[] = [
  { id: 1, label: "Analyzing Metadata & Payload", sub: "Reading file headers, validating structure, computing word density." },
  { id: 2, label: "Extracting Core Content", sub: "Isolating textual arrays and processing content partitions." },
  { id: 3, label: "GenAI Semantic Similarity Scan", sub: "Crosschecking match indexes, checking citation context, scanning repositories using Gemini." },
  { id: 4, label: "Compiling Plagiarism Quality Report", sub: "Calculating integrity index, extracting suspicious segments, formatting downloadable PDF." },
];

export default function CheckProgress() {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    // Progress incrementer mimicking detailed document inspection stages
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        return prev + Math.floor(Math.random() * 4) + 1;
      });
    }, 200);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 4) return 4;
        return prev + 1;
      });
    }, 3800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div id="loading-stage-block" className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Active Analytical Service
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Scanning Document Integrity...
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please hold on while our AI integrity protocols analyze your text content.
          </p>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <span className="text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400">
              {progress}%
            </span>
          </div>
          <div className="w-40 bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-2 border border-gray-200/50 dark:border-slate-700/50">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div
              key={step.id}
              className={`flex flex-col p-4 rounded-2xl transition-all duration-300 border ${
                isActive
                  ? "bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/40 relative scale-[1.02]"
                  : isCompleted
                  ? "bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/20"
                  : "bg-transparent border-transparent opacity-50"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400"
                      : isActive
                      ? "bg-indigo-600 text-white animate-pulse"
                      : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </span>

                <span
                  className={`text-sm font-bold ${
                    isActive
                      ? "text-indigo-900 dark:text-indigo-300"
                      : isCompleted
                      ? "text-emerald-900 dark:text-emerald-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              <p
                className={`text-xs leading-relaxed ${
                  isActive
                    ? "text-indigo-700/80 dark:text-indigo-400"
                    : isCompleted
                    ? "text-emerald-700/70 dark:text-emerald-500"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {step.sub}
              </p>

              {isActive && (
                <div className="absolute top-3 right-3 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center py-4 px-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-indigo-500" />
          <span>Integrity Scan Engine running on <span className="font-semibold text-slate-700 dark:text-slate-300">Gemini 3.5 Flash</span> models. Advanced similarity indexing active.</span>
        </p>
      </div>
    </div>
  );
}
