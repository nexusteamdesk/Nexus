
import { LogOut, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function Header() {
  const { session, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const email = session?.user?.email || "User";
  const userName = session?.user?.user_metadata?.name || email.split('@')[0] || "User";
  const initial = userName[0].toUpperCase();

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="flex items-center justify-between py-6 mb-8 select-none">
      {/* 1. Logo + Greeting Section (Left) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative h-10 w-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-500/20 blur-lg rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-9 w-9 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
          </div>
          <div className="flex flex-col justify-center">
               <h1 className="text-3xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground via-cyan-500 to-foreground animate-text-shimmer bg-[length:200%_auto] font-['Outfit']">
                Nexus
              </h1>
              <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-500/70 uppercase leading-none pl-0.5">
                AI Memory Bank
              </span>
          </div>
        </div>
        
        {/* Personalized Greeting - Hidden on mobile */}
        <div className="hidden lg:flex flex-col ml-4 pl-4 border-l border-border/50">
          <span className="text-sm text-muted-foreground">{getGreeting()},</span>
          <span className="text-lg font-semibold text-foreground">{userName} 👋</span>
        </div>
      </div>

      {/* 2. User Profile (Right) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 bg-card/60 border border-border rounded-full backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {initial}
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:block">{email.split('@')[0]}</span>
          <button onClick={signOut} className="text-muted-foreground hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

