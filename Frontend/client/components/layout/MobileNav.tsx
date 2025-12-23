
import { LayoutGrid } from "lucide-react";

export function MobileNav() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="flex items-center gap-1 p-1.5 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/10">
        <button
          className="p-3 rounded-xl transition-all duration-300 relative overflow-hidden bg-cyan-500/20 text-cyan-400"
        >
          <LayoutGrid size={24} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
