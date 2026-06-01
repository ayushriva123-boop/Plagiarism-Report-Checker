import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ darkMode, onToggle }: ThemeToggleProps) {
  return (
    <button
      id="theme-toggle"
      onClick={onToggle}
      className="p-2 rounded-xl transition-all duration-300 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer flex items-center justify-center border border-gray-200 dark:border-slate-700 shadow-xs"
      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {darkMode ? <Sun className="w-5 h-5 text-amber-500 transition-transform hover:rotate-45" /> : <Moon className="w-5 h-5 text-indigo-600 transition-transform hover:-rotate-12" />}
    </button>
  );
}
