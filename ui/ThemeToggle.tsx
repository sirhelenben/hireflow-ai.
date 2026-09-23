'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;

    const stored = localStorage.getItem('theme');
    return stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  if (!mounted) {
    return <div className="w-[92px] h-[34px]" />;
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="text-sm px-3 py-1.5 rounded-md border border-ink/15 dark:border-paper/15 text-ink dark:text-paper hover:bg-ink/5 dark:hover:bg-paper/10 transition-colors"
    >
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}