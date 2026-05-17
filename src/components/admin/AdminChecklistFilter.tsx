"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ChecklistSelection = ReadonlySet<string> | null;

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function triggerClass(variant: "amber" | "zinc") {
  const base =
    "flex w-full min-w-0 items-center justify-between gap-1 rounded border px-1.5 py-1 text-left text-[11px] font-medium tabular-nums";
  if (variant === "amber") {
    return `${base} border-amber-200/90 bg-white text-zinc-900 hover:bg-amber-50/80 dark:border-amber-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-amber-950/40`;
  }
  return `${base} border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800/80`;
}

function panelClass(variant: "amber" | "zinc") {
  const base =
    "flex max-h-[min(22rem,70vh)] w-[min(16rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border shadow-xl";
  if (variant === "amber") {
    return `${base} border-amber-200 bg-white text-zinc-900 dark:border-amber-800 dark:bg-zinc-900 dark:text-zinc-100`;
  }
  return `${base} border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`;
}

export function AdminChecklistFilter({
  ariaLabel,
  options,
  selected,
  onChange,
  variant,
}: {
  ariaLabel: string;
  options: readonly string[];
  selected: ChecklistSelection;
  onChange: (next: ChecklistSelection) => void;
  variant: "amber" | "zinc";
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [query, setQuery] = useState("");
  const listId = useId();

  const sorted = useMemo(() => [...new Set(options)].filter(Boolean).sort((a, b) => a.localeCompare(b)), [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((x) => x.toLowerCase().includes(q));
  }, [sorted, query]);

  const allSet = useMemo(() => new Set(sorted), [sorted]);

  const effective = selected == null ? allSet : selected;

  const summary = useMemo(() => {
    if (selected == null || sorted.length === 0) return "All";
    if (selected.size === 0) return "None";
    if (setsEqual(selected, allSet)) return "All";
    if (selected.size === 1) {
      const [only] = [...selected];
      const t = only.length > 28 ? `${only.slice(0, 26)}…` : only;
      return t;
    }
    return `${selected.size} selected`;
  }, [selected, sorted, allSet]);

  const reposition = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.min(256, window.innerWidth - 12);
    let left = r.left;
    if (left + w > window.innerWidth - 8) left = window.innerWidth - 8 - w;
    if (left < 8) left = 8;
    let top = r.bottom + 4;
    const maxH = Math.min(22 * 16, window.innerHeight * 0.7);
    if (top + maxH > window.innerHeight - 8) top = Math.max(8, r.top - 4 - maxH);
    setPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    function onScroll() {
      reposition();
    }
    function onResize() {
      reposition();
    }
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(ev: MouseEvent) {
      const t = ev.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
      setQuery("");
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggleValue(v: string) {
    const next = new Set(effective);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    if (next.size === 0) {
      onChange(next);
      return;
    }
    if (setsEqual(next, allSet)) onChange(null);
    else onChange(next);
  }

  function selectAll() {
    onChange(null);
  }

  function clearToNone() {
    onChange(new Set());
  }

  const checked = (v: string) => effective.has(v);

  const panel = open ? (
    <div
      ref={panelRef}
      role="listbox"
      id={listId}
      className={`fixed z-[250] ${panelClass(variant)}`}
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="shrink-0 border-b border-zinc-200 p-2 dark:border-zinc-700">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search values"
          className="w-full rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          aria-label={`${ariaLabel} search`}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={selectAll}
            className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={clearToNone}
            className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {filtered.length === 0 ? (
          <p className="px-1 py-3 text-center text-xs text-zinc-500">No values match.</p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((v) => (
              <li key={v}>
                <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={checked(v)}
                    onChange={() => toggleValue(v)}
                  />
                  <span className="min-w-0 flex-1 break-words text-xs leading-snug">{v}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={triggerClass(variant)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        onClick={() => {
          setOpen((o) => !o);
          if (open) setQuery("");
        }}
      >
        <span className="min-w-0 truncate">{summary}</span>
        <span className="shrink-0 text-zinc-400" aria-hidden>
          ▾
        </span>
      </button>
      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
