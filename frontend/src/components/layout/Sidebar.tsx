'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileUp, 
  Layers, 
  Search, 
  Hammer, 
  BrainCircuit, 
  Activity,
  Sun,
  Moon
} from 'lucide-react';
import DataTruthBadge from '../common/DataTruthBadge';

const NAV_ITEMS = [
  { 
    href: '/intake', 
    label: 'INTAKE', 
    question: 'What complaints came in?',
    icon: FileUp 
  },
  { 
    href: '/situation', 
    label: 'SITUATION', 
    question: 'What is happening?',
    icon: Layers,
    alternateHrefs: ['/']
  },
  { 
    href: '/cases', 
    label: 'CASES', 
    question: 'Why is this happening?',
    icon: Search,
    alternateHrefs: ['/cases/CAS-PUN-2026-001']
  },
  { 
    href: '/execution', 
    label: 'EXECUTION', 
    question: 'What needs to happen now?',
    icon: Hammer,
    alternateHrefs: ['/work-orders']
  },
  { 
    href: '/memory', 
    label: 'MEMORY', 
    question: 'What have we learned?',
    icon: BrainCircuit,
    alternateHrefs: ['/insights']
  },
];

interface SidebarProps {
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export default function Sidebar({ theme = 'dark', onToggleTheme }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (pathname === item.href) return true;
    if (item.alternateHrefs && item.alternateHrefs.includes(pathname)) return true;
    if (item.href !== '/' && pathname.startsWith(item.href)) return true;
    return false;
  };

  return (
    <aside className="app-sidebar select-none">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-sm shadow-blue-500/50" />
          <h1 className="tracking-widest font-bold text-sm">CIVIC PULSE</h1>
        </div>
        <div className="tagline font-mono text-[9px] text-slate-400 mt-1 uppercase tracking-wider">
          Pune Infrastructure Command
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="sidebar-nav flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex flex-col px-3 py-2.5 rounded-md transition-all duration-150 border-l-2 ${
                active
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="text-xs tracking-wider font-mono font-medium uppercase">{item.label}</span>
              </div>
              <span className="text-[10px] text-slate-500 ml-6 font-normal truncate mt-0.5">
                {item.question}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer & Controls */}
      <div className="sidebar-footer p-3 border-t border-[var(--border-primary)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-medium text-slate-300">PMC LIVE</span>
          </div>
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <div>
          <DataTruthBadge truth="DEMO DATA" className="w-full justify-center" />
        </div>
      </div>
    </aside>
  );
}
