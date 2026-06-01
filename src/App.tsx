import React, { useState, useEffect } from "react";
import { Download, ShieldAlert, Cpu, CheckCircle2, History, Trash2, Calendar, FileText, AlertTriangle, ArrowRight, Github, Info, Search } from "lucide-react";
import UploadArea from "./components/UploadArea";
import CheckProgress from "./components/CheckProgress";
import AnalysisResults from "./components/AnalysisResults";
import HistorySidebar from "./components/HistorySidebar";
import ThemeToggle from "./components/ThemeToggle";
import { PlagiarismResult, HistoryItem } from "./types";
import { downloadPdfReport } from "./utils/pdfGenerator";

export default function App() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<PlagiarismResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Submission Form States
  const [authorName, setAuthorName] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [docType, setDocType] = useState("Assignment");

  // Exclude parameters
  const [excludeQuotes, setExcludeQuotes] = useState(true);
  const [excludeBibliography, setExcludeBibliography] = useState(true);
  const [excludeSmallSources, setExcludeSmallSources] = useState(true);

  // Db selection parameters
  const [dbStudentPapers, setDbStudentPapers] = useState(true);
  const [dbJournalsPublishers, setDbJournalsPublishers] = useState(true);
  const [dbInternetWeb, setDbInternetWeb] = useState(true);
  const [dbInstitutionRepository, setDbInstitutionRepository] = useState(true);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Check if system prefers dark, otherwise default to false (clean high-contrast light theme)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cl_plagiarism_theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Sync dark class on raw document body
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("cl_plagiarism_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("cl_plagiarism_theme", "light");
    }
  }, [darkMode]);

  const handleFileChange = (file: File) => {
    setCurrentFile(file);
    setError(null);
    // Set default title matching the raw filename if none entered
    setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleCheckPlagiarism = async () => {
    if (!currentFile) {
      setError("Please select or drop a valid file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveResult(null);

    const formData = new FormData();
    formData.append("file", currentFile);
    formData.append("authorName", authorName);
    formData.append("title", docTitle || currentFile.name.replace(/\.[^/.]+$/, ""));
    formData.append("submittedBy", submittedBy);
    formData.append("documentType", docType);
    formData.append("excludeQuotes", String(excludeQuotes));
    formData.append("excludeBibliography", String(excludeBibliography));
    formData.append("excludeSmallSources", String(excludeSmallSources));
    formData.append("dbStudentPapers", String(dbStudentPapers));
    formData.append("dbJournalsPublishers", String(dbJournalsPublishers));
    formData.append("dbInternetWeb", String(dbInternetWeb));
    formData.append("dbInstitutionRepository", String(dbInstitutionRepository));

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errMsg = "An error occurred while compiling your plagiarism report.";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch {
          // Response is not JSON (e.g. gateway error, 502/504 or unhandled crash)
          try {
            const errText = await response.text();
            if (errText.includes("<title>")) {
              const matches = errText.match(/<title>(.*?)<\/title>/i);
              if (matches && matches[1]) {
                errMsg = `Server error details: ${matches[1]}`;
              }
            } else if (errText.trim().length > 0 && errText.length < 200) {
              errMsg = `Server error response: ${errText.trim()}`;
            } else {
              errMsg = `Server returned status error code ${response.status} (${response.statusText || "Unknown status"}).`;
            }
          } catch {
            errMsg = `Server returned HTTP status code ${response.status}.`;
          }
        }
        throw new Error(errMsg);
      }

      let reportData: PlagiarismResult;
      let rawText = "";
      try {
        rawText = await response.text();
        reportData = JSON.parse(rawText);
      } catch (jsonErr: any) {
        console.error("Failed parsing success response as JSON", jsonErr, "Raw response was:", rawText);
        const trimmed = rawText.trim();
        if (trimmed.startsWith("<!") || trimmed.startsWith("<html") || trimmed.includes("<!doctype") || trimmed.includes("<!DOCTYPE")) {
          throw new Error("The backend server successfully completed but returned its HTML index template instead of the plagiarism report JSON payload. This is typically a temporary network layer or local routing glitch. Please try again.");
        }
        const snippet = trimmed.length > 120 ? trimmed.substring(0, 120) + "..." : trimmed;
        throw new Error(`The plagiarism checker completed successfully, but the feedback schema could not be formatted correctly. (Output: "${snippet}"). Please try again.`);
      }
      setActiveResult(reportData);

      // Create novel history entry
      const historyItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        fileName: reportData.documentStats.fileName,
        date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        score: reportData.plagiarismScore,
        stats: reportData.documentStats,
        result: reportData,
      };

      setHistory((prev) => [historyItem, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process text and connect with the GenAI audit endpoint.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setActiveResult(item.result);
    // Mimic selecting that file
    setCurrentFile(null); 
    setError(null);
  };

  const handleRemoveHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (activeResult && history.find((h) => h.id === id)?.fileName === activeResult.documentStats.fileName) {
      setActiveResult(null);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setActiveResult(null);
  };

  const handleReset = () => {
    setCurrentFile(null);
    setActiveResult(null);
    setError(null);
  };

  const handleDownloadPdf = () => {
    if (activeResult) {
      downloadPdfReport(activeResult);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-linear-to-b from-slate-50 via-gray-50 to-indigo-50/10 text-gray-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-gray-100 pb-16 font-sans">
      
      {/* 1. Nav Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/75 dark:bg-slate-950/75 border-b border-gray-200/60 dark:border-slate-800/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-sm hover:scale-105 transition-transform">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-gray-900 dark:text-white uppercase">
                Plagiarism Report Checker
              </h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-505 font-medium leading-none">
                AI-Powered Writing Integrity Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} />
          </div>
        </div>
      </header>

      {/* 2. Main Body Bento Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Workspace (Left Column, spans 3 Cols) */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Conditional Views */}
            {!isLoading && !activeResult && (
              <section id="workspace-upload" className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 shadow-xs space-y-8 animate-fadeIn">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-full border border-indigo-100 dark:border-indigo-900/40">
                    Verify Writing Integrity Instantly
                  </span>
                  <h2 className="text-3xl font-black text-gray-950 dark:text-gray-50 tracking-tight">
                    DocuScan Plagiarism Audit
                  </h2>
                  <p className="text-sm text-gray-550 dark:text-gray-400 leading-relaxed">
                    Upload your essays, research papers, manuscripts or novels. Our AI systems parse document text, evaluate sentence constructs, and flag unoriginal matches.
                  </p>
                </div>

                <UploadArea onFileSelected={handleFileChange} isLoading={isLoading} />

                {currentFile && !error && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-gray-150 dark:border-slate-800 space-y-6 animate-slideUp">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-slate-800">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wide text-gray-800 dark:text-gray-200">
                        Submission Information & Database Options (Plagiarism Report Checker Style)
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Author Name */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                          Author Name
                        </label>
                        <input
                          type="text"
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          placeholder="e.g. AYUSH SHRIVASTAVA"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none dark:text-gray-100 font-medium transition-all"
                        />
                      </div>

                      {/* Submission Title */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                          Submission Title
                        </label>
                        <input
                          type="text"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          placeholder="Enter custom paper title"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none dark:text-gray-100 font-medium transition-all"
                        />
                      </div>

                      {/* Submitted By */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                          Submitted By (Email)
                        </label>
                        <input
                          type="email"
                          value={submittedBy}
                          onChange={(e) => setSubmittedBy(e.target.value)}
                          placeholder="e.g. 25261930.ayush@gdgu.org"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none dark:text-gray-100 font-medium transition-all"
                        />
                      </div>

                      {/* Document Type */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                          Document Type
                        </label>
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none dark:text-gray-100 font-medium transition-all cursor-pointer"
                        >
                          <option value="Assignment">Assignment</option>
                          <option value="Thesis">Thesis</option>
                          <option value="Dissertation">Dissertation</option>
                          <option value="Research Paper">Research Paper</option>
                          <option value="Project Report">Project Report</option>
                          <option value="Custom Manuscript">Custom Manuscript</option>
                        </select>
                      </div>
                    </div>

                    {/* Exclude Criteria */}
                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                        Exclude Information Criteria
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-gray-150 dark:border-slate-800 cursor-pointer hover:border-indigo-300 dark:hover:border-slate-750 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={excludeQuotes}
                            onChange={(e) => setExcludeQuotes(e.target.checked)}
                            className="rounded border-gray-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">Exclude Quotes</span>
                            <span className="block text-[10px] text-gray-400 leading-none mt-0.5">Skip raw quoted segments</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-gray-150 dark:border-slate-800 cursor-pointer hover:border-indigo-300 dark:hover:border-slate-750 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={excludeBibliography}
                            onChange={(e) => setExcludeBibliography(e.target.checked)}
                            className="rounded border-gray-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">Exclude Bibliography</span>
                            <span className="block text-[10px] text-gray-400 leading-none mt-0.5">Ignore reference listings</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-gray-150 dark:border-slate-800 cursor-pointer hover:border-indigo-300 dark:hover:border-slate-750 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={excludeSmallSources}
                            onChange={(e) => setExcludeSmallSources(e.target.checked)}
                            className="rounded border-gray-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">Exclude Words &lt; 14</span>
                            <span className="block text-[10px] text-gray-400 leading-none mt-0.5">Filter common structures</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Database Selection */}
                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                        Database Search Selection
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-950 border border-gray-150 dark:border-slate-800 cursor-pointer hover:border-indigo-300 dark:hover:border-slate-750 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={dbStudentPapers}
                            onChange={(e) => setDbStudentPapers(e.target.checked)}
                            className="rounded border-gray-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-tight">Student Papers</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-950 border border-gray-150 dark:border-slate-800 cursor-pointer hover:border-indigo-300 dark:hover:border-slate-750 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={dbJournalsPublishers}
                            onChange={(e) => setDbJournalsPublishers(e.target.checked)}
                            className="rounded border-gray-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-tight">Journals &amp; Pubs</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-950 border border-gray-150 dark:border-slate-800 cursor-pointer hover:border-indigo-300 dark:hover:border-slate-750 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={dbInternetWeb}
                            onChange={(e) => setDbInternetWeb(e.target.checked)}
                            className="rounded border-gray-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-tight">Internet or Web</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-950 border border-gray-150 dark:border-slate-800 cursor-pointer hover:border-indigo-300 dark:hover:border-slate-750 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={dbInstitutionRepository}
                            onChange={(e) => setDbInstitutionRepository(e.target.checked)}
                            className="rounded border-gray-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-tight">Institution Repo</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {currentFile && !error && (
                  <div className="flex justify-center pt-2 animate-slideUp">
                    <button
                      id="trigger-analysis-button"
                      onClick={handleCheckPlagiarism}
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/15 hover:shadow-indigo-500/30 w-full sm:w-auto cursor-pointer"
                    >
                      Analyze Document with Selected Options
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                )}

                {error && (
                  <div id="check-execution-error" className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-300 animate-slideUp">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-semibold">Analysis Failed:</span> {error}
                      <button
                        onClick={handleReset}
                        className="block mt-2 font-bold text-rose-600 hover:underline cursor-pointer text-xs"
                      >
                        Reset Workspace & Try Again
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-slate-800 shrink-0 flex items-center justify-center text-indigo-500">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">Deep Semantic Scan</h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">Looks beyond exact words to find smart paraphrasing modifications.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-slate-800 shrink-0 flex items-center justify-center text-indigo-500">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">Instant PDF Downloads</h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">Download beautifully structured vectors of results for academic proof-checks.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-slate-800 shrink-0 flex items-center justify-center text-indigo-500">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">100% Secure & Private</h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">Documents are scanned in-memory and never cached permanently on the internet.</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {isLoading && <CheckProgress />}

            {activeResult && !isLoading && (
              <AnalysisResults
                result={activeResult}
                onDownloadPdf={handleDownloadPdf}
                onNewCheck={handleReset}
              />
            )}

          </div>

          {/* Sidebar Area (Right Column, spans 1 Col) */}
          <div className="lg:col-span-1 space-y-8">
            <HistorySidebar
              items={history}
              selectedId={history.find((h) => h.fileName === activeResult?.documentStats.fileName)?.id || null}
              onSelect={handleSelectHistoryItem}
              onClear={handleClearHistory}
              onRemoveItem={handleRemoveHistoryItem}
            />
          </div>

        </div>
      </main>

      {/* 3. Footer */}
      <footer className="mt-20 border-t border-gray-200/60 dark:border-slate-800/60 pt-8 text-center text-xs text-gray-400 transition-colors">
        <p className="mb-2">Plagiarism Report Checker • Developed with modern full-stack web architectures</p>
        <p className="font-mono text-[10px] text-gray-500">Made by Ayush Shrivastava</p>
      </footer>

    </div>
  );
}
