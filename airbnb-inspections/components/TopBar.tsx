import Link from "next/link";

export default function TopBar({
  title,
  backHref,
  right,
}: {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 bg-ink text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Back"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg active:bg-ink-light"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        ) : (
          <div className="flex h-12 w-10 shrink-0 items-center justify-center">
            <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
              <g transform="rotate(-8 32 32)">
                <rect x="16" y="12" width="32" height="42" rx="6" fill="#edf1ee" />
                <circle cx="32" cy="20" r="3.2" fill="#11363b" opacity="0.85" />
                <path
                  d="M24 37l6 6 11-12"
                  fill="none"
                  stroke="#0e7d71"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </div>
        )}
        <h1 className="display min-w-0 flex-1 truncate text-base leading-tight">
          {title}
        </h1>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
