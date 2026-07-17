// Small inline SVG icon set (stroke-based, inherits currentColor) so the site
// needs no external assets or icon packages.

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    bolt: <path d="M13 2 4.5 14H11l-1.5 8L18 10h-6.5L13 2Z" />,
    alert: (
      <>
        <path d="M12 3 2.5 20h19L12 3Z" />
        <path d="M12 9.5v5" />
        <path d="M12 17.2v.3" />
      </>
    ),
    switchboard: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M4 9h16M4 15h16" />
        <path d="M8 6h.5M8 12h.5M8 18h.5" />
        <path d="M12.5 6H16M12.5 12H16M12.5 18H16" />
      </>
    ),
    ev: (
      <>
        <path d="M5 20V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14" />
        <path d="M3.5 20h13" />
        <path d="M15 9h2.5a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0v-6L20 7.5" />
        <path d="m10.5 7-2.5 4h3l-2.5 4" />
      </>
    ),
    bulb: (
      <>
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.6 1 2.5h6c0-.9.2-1.8 1-2.5A6 6 0 0 0 12 3Z" />
      </>
    ),
    tree: (
      <>
        <path d="M12 22v-7" />
        <path d="m12 3-5 7h3l-4 6h12l-4-6h3l-5-7Z" />
      </>
    ),
    building: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
        <path d="M15 9h3a2 2 0 0 1 2 2v10" />
        <path d="M8.5 7h2M8.5 11h2M8.5 15h2" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M10 21v-6h4v6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 4.5 5.5v5c0 5 3 9.5 7.5 11.5 4.5-2 7.5-6.5 7.5-11.5v-5L12 2Z" />
        <path d="m8.5 12 2.5 2.5L15.5 9.5" />
      </>
    ),
    phone: (
      <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    ),
    check: <path d="m4.5 12.5 5 5 10-11" />,
    pin: (
      <>
        <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    star: (
      <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9 2.9-6Z" />
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3.5 7 8.5 6 8.5-6" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...strokeProps}>
      {paths[name] ?? paths.bolt}
    </svg>
  );
}

export function BoltLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="14" fill="#0B2545" />
      <path d="M36 6 16 36h12l-4 22 24-32H34l6-20z" fill="#E8720C" />
    </svg>
  );
}
