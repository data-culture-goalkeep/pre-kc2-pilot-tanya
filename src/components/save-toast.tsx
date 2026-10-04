"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const TOAST_VISIBLE_MS = 3000;
export const TOAST_FADE_MS = 200;

export function SaveToast({ savedAt }: { savedAt: number }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    if (!savedAt) return;
    const show = setTimeout(() => { setVisible(true); setFading(false); }, 0);
    const fade = setTimeout(() => setFading(true), TOAST_VISIBLE_MS);
    const hide = setTimeout(() => setVisible(false), TOAST_VISIBLE_MS + TOAST_FADE_MS);
    return () => { clearTimeout(show); clearTimeout(fade); clearTimeout(hide); };
  }, [savedAt]);
  if (!visible) return null;
  return <div role="status" className={cn("fixed bottom-6 left-4 right-4 z-50 rounded-lg border border-brand-purple bg-card px-5 py-4 text-sm shadow-lg transition-opacity duration-200 motion-reduce:transition-none sm:left-auto sm:right-6", fading ? "opacity-0" : "opacity-100")}>Entry saved successfully</div>;
}
