"use client";

import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";

export function PrintToolbar() {
  const [showAutoPrintNote, setShowAutoPrintNote] = useState(false);

  useEffect(() => {
    // If autoPrint parameter is present, trigger window.print() once page has loaded
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoPrint") === "true") {
      setShowAutoPrintNote(true);
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <aside
      aria-label="Print controls"
      className="print:hidden fixed top-3 right-4 z-50 flex items-center gap-2 rounded-xl bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-800 shadow-xl px-3.5 py-2 text-stone-900 dark:text-stone-100 backdrop-blur-md transition-all"
    >
      <div className="flex flex-col">
        <span className="text-xs font-semibold">Save as PDF</span>
        {showAutoPrintNote ? (
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            Select &quot;Save as PDF&quot; in the print dialog
          </span>
        ) : (
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            Press Cmd+P or click print
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
      >
        <Printer size={13} />
        Save as PDF
      </button>

      <button
        type="button"
        onClick={() => window.close()}
        aria-label="Close tab"
        className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
        title="Close this print view"
      >
        <X size={14} />
      </button>
    </aside>
  );
}
