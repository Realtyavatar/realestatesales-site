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
    <header className="sticky top-0 z-20 bg-navy text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Back"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl active:bg-navy-light"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        ) : (
          <div className="flex h-12 w-10 shrink-0 items-center justify-center">
            <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
              <path d="M36 6 16 36h12l-4 22 24-32H34l6-20z" fill="#E8720C" />
            </svg>
          </div>
        )}
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
