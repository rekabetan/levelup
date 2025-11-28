// app/components/admin/AdminMetricCard.tsx
'use client';

import React from 'react';

type AdminMetricCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function AdminMetricCard({
  title,
  subtitle,
  children,
}: AdminMetricCardProps) {
  return (
    <div
      className="relative flex flex-col rounded-[32px] bg-[#050505] border border-[#1a1a1a] shadow-[0_0_40px_rgba(0,0,0,0.7)] px-6 pt-6 pb-5 min-h-[220px]"
    >
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-sm tracking-[0.24em] font-semibold text-slate-200">
          {title.toUpperCase()}
        </h2>

        {subtitle && (
          <p className="text-[11px] font-medium tracking-[0.18em] text-slate-500">
            {subtitle.toUpperCase()}
          </p>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
