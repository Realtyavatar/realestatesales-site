import Link from "next/link";
import { business } from "@/lib/data";
import { Icon } from "./icons";

// Fixed bottom bar on mobile: the two actions a phone visitor actually wants.
export default function StickyCallBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-px border-t border-gray-200 bg-gray-200 md:hidden">
      <a href={business.phoneHref} className="flex min-h-[56px] items-center justify-center gap-2 bg-brand font-bold text-white">
        <Icon name="phone" className="h-5 w-5" />
        Call Now
      </a>
      <Link href="/contact" className="flex min-h-[56px] items-center justify-center gap-2 bg-navy font-bold text-white">
        <Icon name="mail" className="h-5 w-5" />
        Free Quote
      </Link>
    </div>
  );
}
