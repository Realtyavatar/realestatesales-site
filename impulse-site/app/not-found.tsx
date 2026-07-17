import Link from "next/link";
import { business } from "@/lib/data";
import { Icon } from "@/components/icons";

export default function NotFound() {
  return (
    <section className="container-site flex flex-col items-center gap-5 py-24 text-center">
      <h1 className="text-5xl font-extrabold">Page not found</h1>
      <p className="max-w-md text-navy/70">
        That page doesn’t exist — but we’re still easy to reach.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a href={business.phoneHref} className="btn-primary">
          <Icon name="phone" className="h-5 w-5" />
          Call {business.phone}
        </a>
        <Link href="/" className="btn-outline">
          Back to home
        </Link>
      </div>
    </section>
  );
}
