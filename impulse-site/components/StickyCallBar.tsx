import Link from "next/link";
import { business } from "@/lib/data";

// Fixed bottom bar on mobile: the two actions a phone visitor actually wants.
export default function StickyCallBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 md:hidden">
      <a
        href={business.phoneHref}
        className="flex min-h-[56px] items-center justify-center bg-brand font-condensed text-lg font-bold uppercase tracking-[0.08em] text-white"
      >
        Call now
      </a>
      <Link
        href="/contact"
        className="flex min-h-[56px] items-center justify-center bg-navy font-condensed text-lg font-bold uppercase tracking-[0.08em] text-white"
      >
        Get a quote
      </Link>
    </div>
  );
}
