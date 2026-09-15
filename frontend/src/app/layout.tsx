'use client';

import { useState } from 'react';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import type { AppMode } from '@/types';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<AppMode>('operator');

  return (
    <html lang="en">
      <head>
        <title>CIVIC PULSE — Urban Infrastructure Intelligence</title>
        <meta
          name="description"
          content="Evidence-driven urban infrastructure intelligence and decision platform. See the problem. Simulate the response. Prove the outcome."
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="app-main">
            <TopBar mode={mode} onModeChange={setMode} />
            <main className="app-content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
