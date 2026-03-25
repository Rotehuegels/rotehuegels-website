"use client";
import { useEffect, useState } from "react";

type Item = { id: string; label: string };

export default function StoryTOC({ items }: { items: Item[] }) {
  const [active, setActive] = useState<string>(items[0]?.id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis?.target?.id) setActive(vis.target.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0.1, 0.25, 0.5] }
    );
    items.forEach(i => {
      const el = document.getElementById(i.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [items]);

  return (
    <aside className="hidden lg:block lg:sticky lg:top-24 lg:max-h-[70vh] lg:overflow-auto">
      <div className="text-sm space-y-2">
        <div className="uppercase tracking-wide text-neutral-400">On this page</div>
        <ul className="space-y-1">
          {items.map(i => (
            <li key={i.id}>
              <a
                href={`#${i.id}`}
                className={`block py-1 hover:text-rose-400 ${
                  active === i.id ? "text-rose-400" : "text-neutral-300"
                }`}
              >
                {i.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}