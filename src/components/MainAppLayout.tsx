import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { XP_PER_LEVEL_FORMULA } from '../utils';
import { Compass, Book, Shield, Bot, ScrollText, GitMerge, Sparkles, User as UserIcon, LogOut, Target, Menu, X, Briefcase, Map } from 'lucide-react';

const MainAppLayout: React.FC = () => {
  const { user, handleReset } = useUser();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const nextLevelXP = XP_PER_LEVEL_FORMULA(user.level);
  const xpProgress = user.currentXP > 0 && nextLevelXP > 0 ? (user.currentXP / nextLevelXP) * 100 : 0;

  const sidebarNavLinks = [
    { to: "/app/dashboard", icon: Compass, label: "Dashboard" },
    { to: "/app/mapa", icon: Map, label: "Mapa" },
    { to: "/app/missions", icon: Target, label: "Missões" },
    { to: "/app/codex", icon: Book, label: "Codex" },
    { to: "/app/guild", icon: Shield, label: "Guilda" },
    { to: "/app/mentor", icon: Bot, label: "Oráculo" },
    { to: "/app/journal", icon: ScrollText, label: "Diário" },
    { to: "/app/skills", icon: GitMerge, label: "Habilidades" },
    { to: "/app/arsenal", icon: Briefcase, label: "Arsenal" },
    { to: "/app/pantheon", icon: Sparkles, label: "Panteão" },
  ];
  
  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
     <div className="flex flex-col h-full bg-zinc-950">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h1 className="font-mono font-bold text-lg uppercase tracking-tighter flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500 animate-subtle-pulse" /> Hero Mindset
            </h1>
        </div>
        <NavLink to="/app/profile" onClick={onLinkClick} className="p-4 flex items-center gap-3 border-b border-zinc-800 hover:bg-zinc-900 transition-colors">
            <UserIcon className="w-10 h-10 p-2 rounded-full bg-zinc-800"/>
            <div>
                <p className="font-bold text-white truncate max-w-[140px]">{user.name}</p>
                <p className="text-xs text-zinc-400">{user.rank}</p>
            </div>
        </NavLink>
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
            {sidebarNavLinks.map(link => (
                <NavLink key={link.to} to={link.to} onClick={onLinkClick} className={({ isActive }) =>`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
                    <link.icon className="w-5 h-5" />
                    {link.label}
                </NavLink>
            ))}
        </nav>
        <div className="p-4 border-t border-zinc-800">
            <button onClick={handleReset} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-800/50">
                <LogOut className="w-5 h-5" /> Sair
            </button>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <aside className="hidden md:block w-64 flex-shrink-0 border-r border-zinc-800"><SidebarContent /></aside>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-zinc-950 border-r border-zinc-800 animate-in slide-in-from-left-full duration-300">
            <button onClick={() => setIsMobileSidebarOpen(false)} className="absolute top-3 right-3 text-zinc-400"><X /></button>
            <SidebarContent onLinkClick={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 px-4 py-3 flex items-center gap-4">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden text-zinc-400"><Menu/></button>
            <div className="flex-grow flex items-center gap-4">
              <div className="font-mono text-xs sm:text-sm"><span className="font-bold text-white">LVL {user.level}</span></div>
              <div className="flex-grow bg-zinc-800 rounded-full h-2.5 relative overflow-hidden"><div className="bg-gradient-to-r from-red-600 to-red-400 h-full" style={{ width: `${xpProgress}%` }}></div></div>
              <div className="font-mono text-xs text-zinc-400 hidden sm:block">{user.currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP</div>
            </div>
        </header>
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-zinc-950 pb-20 md:pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainAppLayout;