import React from "react";
import { HistoryItem } from "../types";
import { History, FileText, Calendar, Trash2, ChevronRight, Sparkles } from "lucide-react";

interface HistorySidebarProps {
  items: HistoryItem[];
  selectedId: string | null;
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onRemoveItem: (id: string, e: React.MouseEvent) => void;
}

export default function HistorySidebar({
  items,
  selectedId,
  onSelect,
  onClear,
  onRemoveItem,
}: HistorySidebarProps) {
  if (items.length === 0) {
    return (
      <div id="history-sidebar" className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4">
        <div className="mx-auto w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">No session scans</h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Scanned files in your current session will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="history-sidebar" className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 flex flex-col h-full max-h-[550px] overflow-hidden justify-between">
      <div className="overflow-hidden flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-500" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Session Scans
            </h4>
          </div>
          <button
            id="clear-all-history-button"
            onClick={onClear}
            className="text-[11px] font-bold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            Clear All
          </button>
        </div>

        <div className="space-y-2.5 overflow-y-auto pr-1 grow">
          {items.map((item) => {
            const isSelected = selectedId === item.id;
            
            let scoreColor = "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20";
            if (item.score > 10 && item.score <= 25) {
              scoreColor = "text-amber-600 bg-amber-50 dark:bg-amber-950/20";
            } else if (item.score > 25 && item.score <= 50) {
              scoreColor = "text-orange-600 bg-orange-50 dark:bg-orange-950/20";
            } else if (item.score > 50) {
              scoreColor = "text-rose-600 bg-rose-50 dark:bg-rose-950/20";
            }

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`group relative p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-indigo-50/50 border-indigo-200 dark:bg-slate-800 dark:border-slate-700"
                    : "bg-transparent border-gray-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="min-w-0 grow">
                  <div className="flex items-center gap-1.5 mb-1 text-gray-900 dark:text-gray-100">
                    <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <h5 className="font-semibold text-xs truncate max-w-[150px] leading-none">
                      {item.fileName}
                    </h5>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span className="truncate">{item.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-black font-mono ${scoreColor}`}>
                    {item.score}%
                  </span>
                  
                  <button
                    onClick={(e) => onRemoveItem(item.id, e)}
                    className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center gap-1.5 p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl">
          <Sparkles className="w-4 h-4 text-indigo-500 hover:scale-105 shrink-0" />
          <p className="text-[10px] leading-relaxed text-indigo-800/80 dark:text-indigo-400">
            Reports are temporarily saved in your current active session.
          </p>
        </div>
      </div>
    </div>
  );
}
