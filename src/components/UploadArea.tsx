import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

interface UploadAreaProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export default function UploadArea({ onFileSelected, isLoading }: UploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    setError(null);
    const validExtensions = [".pdf", ".docx", ".txt"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError("Unsupported format. Only PDF, DOCX, and TXT files are allowed.");
      return false;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File is too large. Maximum supported size is 10MB.");
      return false;
    }

    return true;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelected(file);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelected(file);
      }
    }
  };

  const onButtonClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div id="upload-panel" className="w-full">
      <div
        id="drag-drop-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden ${
          dragActive
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-slate-800/40 scale-[1.01]"
            : "border-gray-300 hover:border-indigo-400 bg-white/70 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-950/80"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          id="file-upload-input"
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center text-center max-w-md w-full animate-fadeIn">
            <div className="p-4 bg-emerald-100 dark:bg-emerald-950/50 rounded-full mb-4 text-emerald-600 dark:text-emerald-400 scale-110">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <h4 id="uploaded-file-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate w-full px-4 mb-1">
              {selectedFile.name}
            </h4>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-1.5 font-mono">
              <FileText className="w-3.5 h-3.5" />
              {formatBytes(selectedFile.size)} • {selectedFile.name.split(".").pop()?.toUpperCase()}
            </p>

            {!isLoading && (
              <button
                id="remove-file-button"
                onClick={clearFile}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 hover:bg-rose-600 rounded-xl transition-all duration-200 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Remove & Choose Another
              </button>
            )}
            
            {isLoading && (
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 animate-pulse">
                Clicking Analyze document below...
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-indigo-50 dark:bg-slate-800 rounded-full mb-4 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-10 h-10" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Upload your document
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
              Drag and drop your file here, or click to browse. Supports <span className="font-semibold text-gray-700 dark:text-gray-300">PDF, DOCX,</span> or <span className="font-semibold text-gray-700 dark:text-gray-300">TXT</span> up to 10MB.
            </p>

            <span className="inline-flex px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/55 rounded-xl border border-indigo-100 dark:border-indigo-900/60 hover:bg-indigo-100/50 dark:hover:bg-indigo-950 transition-all duration-200 shadow-xs">
              Select File
            </span>
          </div>
        )}
      </div>

      {error && (
        <div id="upload-error-block" className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-300 animate-slideUp">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Upload Error:</span> {error}
          </div>
        </div>
      )}
    </div>
  );
}
