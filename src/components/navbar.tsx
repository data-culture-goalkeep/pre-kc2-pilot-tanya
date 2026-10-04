"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import logo from "../../public/happy-feet-home-logo.png";
import { NAVIGATION } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  return (
    <header className="border-b border-border bg-card" onKeyDown={(event) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Happy Feet Home dashboard home" className="flex shrink-0 items-center gap-3 rounded-lg" onClick={() => setMenuOpen(false)}>
          <Image src={logo} alt="" className="h-16 w-auto" sizes="74px" preload />
          <span>
            <span className="block text-base font-semibold">Happy Feet Home</span>
            <span className="block text-xs text-muted-foreground">Program dashboard</span>
          </span>
        </Link>

        <button ref={menuButton} type="button" aria-expanded={menuOpen} aria-controls="primary-navigation" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border px-3 text-foreground lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            {menuOpen ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>

        <nav id="primary-navigation" aria-label="Primary navigation" className={cn("w-full pt-3 lg:w-auto lg:pt-0", menuOpen ? "block" : "hidden lg:block")}>
          <ul className="flex flex-col gap-1 lg:flex-row lg:items-center">
            {NAVIGATION.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link href={href} aria-current={isActive ? "page" : undefined} onClick={() => setMenuOpen(false)} className={cn("flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none", isActive ? "bg-brand-soft-pink text-foreground" : "text-muted-foreground hover:bg-brand-light-blue hover:text-foreground")}>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
