"use client";

/**
 * Tooltip wrapper that renders via a portal at document.body so it is never
 * clipped by overflow:hidden parents (e.g. DataTable containers).
 *
 * Usage:
 *   <Tip label="Delete Episode"><Trash2 size={14} /></Tip>
 */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TipProps {
  label: string;
  children: React.ReactNode;
}

export default function Tip({ label, children }: TipProps) {
  const ref                     = useRef<HTMLSpanElement>(null);
  const [visible, setVisible]   = useState(false);
  const [coords, setCoords]     = useState({ top: 0, left: 0 });
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function show() {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setCoords({
      top:  r.top + window.scrollY - 8,   // 8px gap above the element
      left: r.left + r.width / 2 + window.scrollX,
    });
    setVisible(true);
  }

  function hide() { setVisible(false); }

  return (
    <span
      ref={ref}
      className="inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {mounted && visible && createPortal(
        <span
          style={{ top: coords.top, left: coords.left }}
          className="fixed z-[9999] -translate-x-1/2 -translate-y-full pointer-events-none whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white shadow-sm"
        >
          {label}
        </span>,
        document.body,
      )}
    </span>
  );
}
