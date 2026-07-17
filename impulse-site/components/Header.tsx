"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { business } from "@/lib/data";
import { BoltLogo, Icon } from "./icons";

const links = [
  { href: "/services", label: "Services" },
  { href: "/areas", label: "Service Areas" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <BoltLogo className="h-9 w-9" />
          <span className="text-lg leading-tight">
            Impulse <span className="text-brand">Electrical</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-semibold transition hover:text-brand ${
                pathname.startsWith(l.href) ? "text-brand" : "text-navy/80"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <a href={business.phoneHref} className="btn-primary !min-h-[44px] !px-4 text-sm">
            <Icon name="phone" className="h-4 w-4" />
            {business.phone}
          </a>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <a href={business.phoneHref} className="btn-primary !min-h-[44px] !px-4 text-sm" aria-label={`Call ${business.phone}`}>
            <Icon name="phone" className="h-4 w-4" />
            Call
          </a>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-gray-200 bg-white md:hidden" aria-label="Mobile">
          <div className="container-site flex flex-col py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-gray-100 py-3.5 text-base font-semibold last:border-0"
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
