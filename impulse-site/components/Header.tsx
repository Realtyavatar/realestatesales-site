"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { business } from "@/lib/data";
import { BoltLogo } from "./icons";

const links = [
  { href: "/services", label: "Services" },
  { href: "/areas", label: "Areas" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="hazard" aria-hidden />
      <div className="container-site flex h-[68px] items-center justify-between gap-6 border-b border-line">
        <Link href="/" className="flex items-center gap-3">
          <BoltLogo className="h-10 w-10" />
          <span className="leading-none">
            <span className="display block text-2xl">
              Impulse <span className="text-brand">Electrical</span>
            </span>
            <span className="font-condensed text-[13px] font-semibold uppercase tracking-[0.14em] text-mute">
              Mornington Peninsula · REC 25266
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`font-condensed text-lg font-semibold uppercase tracking-[0.08em] transition hover:text-brand ${
                pathname.startsWith(l.href) ? "text-brand" : "text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <a
            href={business.phoneHref}
            className="phone-lockup border-l border-line pl-7 text-2xl text-ink transition hover:text-brand"
          >
            {business.phone}
          </a>
        </nav>

        <div className="flex items-center gap-4 md:hidden">
          <a href={business.phoneHref} className="phone-lockup text-xl" aria-label={`Call ${business.phone}`}>
            {business.phone}
          </a>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="flex h-11 w-11 items-center justify-center border border-line"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-b border-line bg-white md:hidden" aria-label="Mobile">
          <div className="container-site flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-4 font-condensed text-xl font-semibold uppercase tracking-[0.08em] last:border-0"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
