// The bolt mark — the one piece of iconography the brand keeps.

export function BoltLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="6" fill="#0B2545" />
      <path d="M36 6 16 36h12l-4 22 24-32H34l6-20z" fill="#E8720C" />
    </svg>
  );
}
