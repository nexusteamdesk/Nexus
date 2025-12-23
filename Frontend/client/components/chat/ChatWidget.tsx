
import { useState } from 'react';
import { MessageSquare, Lock, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatWidget() {
  const [showToast, setShowToast] = useState(false);

  const handleClick = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      {/* Floating Chat Button with Lock - Positioned LEFT */}
      <button
        onClick={handleClick}
        className={cn(
          "fixed bottom-8 left-8 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 hover:scale-110",
          "bg-gradient-to-r from-zinc-700 to-zinc-600 text-zinc-400"
        )}
        aria-label="Chat coming soon"
      >
        <div className="relative">
          <MessageSquare className="h-6 w-6" />
          {/* Lock Badge */}
          <div className="absolute -top-1 -right-1 bg-zinc-800 rounded-full p-0.5 border border-zinc-600">
            <Lock className="h-2.5 w-2.5 text-zinc-400" />
          </div>
        </div>
      </button>

      {/* Coming Soon Toast */}
      <div className={cn(
        "fixed bottom-24 left-8 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl transition-all duration-300",
        showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-zinc-400" />
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-200">Chat is coming soon!</p>
          <p className="text-xs text-zinc-500">Stay tuned for AI memory recall</p>
        </div>
      </div>
    </>
  );
}
