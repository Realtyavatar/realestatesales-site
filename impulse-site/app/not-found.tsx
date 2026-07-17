import Link from "next/link";
import { business } from "@/lib/data";

export default function NotFound() {
  return (
    <section className="container-site flex flex-col items-start gap-6 py-24">
      <h1 className="display text-6xl sm:text-7xl">Page not found</h1>
      <p className="max-w-md text-lg text-mute">
        That page doesn’t exist — but we’re still easy to reach.
      </p>
      <div className="flex flex-wrap gap-4">
        <a href={business.phoneHref} className="btn-primary">
          Call {business.phone}
        </a>
        <Link href="/" className="btn-ghost">
          Back to home
        </Link>
      </div>
    </section>
  );
}
