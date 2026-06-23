"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { T } from "@/components/T";
import { SiteSearch } from "@/components/SiteSearch";
import { ShareButton } from "@/components/ShareButton";
import { HeaderNav } from "@/components/HeaderNav";
import { LocaleToggle } from "@/components/LocaleToggle";
import { MobileNav } from "@/components/MobileNav";
import { AccountControl } from "@/components/auth/AccountControl";

/**
 * Site header. On the Home it floats transparent over the dark radar hero
 * (cream chrome) and turns solid (paper) once you scroll past the hero; every
 * other route keeps the solid sticky header exactly as before.
 *
 * `dark` is true ONLY on the Home while at the top — so non-Home pages and the
 * scrolled Home render identically to the previous static header (zero risk).
 */
export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setAtTop(window.scrollY < 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const dark = isHome && atTop;

  return (
    <header
      className={`top-0 z-50 transition-colors duration-300 ${
        isHome ? "fixed inset-x-0" : "sticky"
      } ${
        dark
          ? "border-b-4 border-transparent bg-transparent"
          : "border-b-4 border-text bg-bg"
      }`}
    >
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex max-w-7xl items-stretch justify-between gap-x-2 px-4 sm:gap-x-6 sm:px-6"
      >
        <Link
          href="/"
          className={`group flex min-w-0 items-center gap-3 py-5 ${dark ? "text-bg" : "text-text"}`}
          aria-label="UAP Codex"
        >
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center bg-accent text-bg transition group-hover:rotate-180"
          >
            <span className="font-mono text-sm leading-none">▲</span>
          </span>
          <span className="font-display text-2xl font-medium leading-none tracking-tight md:text-3xl">
            UAP
            <span
              className={`ml-1 italic ${dark ? "text-accent-bright" : "text-accent"}`}
            >
              Codex
            </span>
          </span>
        </Link>

        <div className="hidden items-stretch gap-3 xl:flex">
          <div className="flex items-center gap-2">
            <SiteSearch dark={dark} />
            <ShareButton variant="icon" dark={dark} />
          </div>
          <HeaderNav dark={dark} />
          <Link
            href="/probabilidades"
            className={`inline-flex items-center gap-2 border-l-4 bg-accent px-4 font-display text-base font-medium text-bg ${
              dark
                ? "border-bg/20 hover:bg-bg hover:text-text"
                : "border-text hover:bg-text"
            }`}
          >
            <T es="Ver probabilidades" en="See probabilities" />
            <span aria-hidden>→</span>
          </Link>
          <AccountControl dark={dark} />
          <LocaleToggle dark={dark} />
        </div>

        <MobileNav dark={dark} />
      </nav>
    </header>
  );
}
