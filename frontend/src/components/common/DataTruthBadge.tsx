'use client';

import React from 'react';
import type { DataTruth } from '@/types';

interface DataTruthBadgeProps {
  truth?: DataTruth | string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function DataTruthBadge({ truth = 'REAL_DATA', className = '', size = 'sm' }: DataTruthBadgeProps) {
  const getBadgeConfig = (t: string) => {
    switch (t) {
      case 'REAL_DATA':
        return {
          label: 'REAL DATA',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'EVIDENCE':
        return {
          label: 'EVIDENCE',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-400',
        };
      case 'MODEL_ESTIMATION':
        return {
          label: 'MODEL ESTIMATION',
          bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          dot: 'bg-cyan-400',
        };
      case 'SYNTHETIC_DATA':
        return {
          label: 'SYNTHETIC DATA',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'ASSUMPTION':
        return {
          label: 'ASSUMPTION',
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          dot: 'bg-purple-400',
        };
      case 'AI_GENERATED_TEXT':
        return {
          label: 'AI-GENERATED',
          bg: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
          dot: 'bg-violet-400',
        };
      default:
        return {
          label: t,
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig(truth);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded border font-medium select-none ${config.bg} ${sizeClasses} ${className}`}
      title={`Data Truth Provenance: ${config.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
