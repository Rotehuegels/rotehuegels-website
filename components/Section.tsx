// components/Section.tsx
import React from "react";

export default function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 text-sm sm:text-base text-zinc-400">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
