'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AppMode, SystemStatus } from '@/types';
import { NAV_ITEMS } from '@/lib/constants';
import { api } from '@/services/api';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <h1>CIVIC PULSE</h1>
        <div className="tagline">Urban Infrastructure Intelligence</div>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? 'active' : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        <Link href="/chat" className={`nav-item ${pathname === '/chat' ? 'active' : ''}`}>
          <span className="nav-icon">✦</span>
          AI Assistant
        </Link>
      </nav>
      <div className="sidebar-footer">
        Prototype · Synthetic Data
      </div>
    </aside>
  );
}
