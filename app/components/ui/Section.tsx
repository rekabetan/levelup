// components/ui/Section.tsx (renaming from SectionCard if you want)

import React from "react";
import Link from "next/link";

type SectionProps = {
  title: string;
  action?: React.ReactNode; // e.g. <Link href="/logs">Show more →</Link>
  children: React.ReactNode;
  className?: string;
};

export default function Section({
  title,
  action,
  children,
  className = "",
}: SectionProps) {
  return (
    <section className={`mb-8 ${className}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        {action && action}
      </div>

      {/* Card shell */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
        {children}
      </div>
    </section>
  );
}
