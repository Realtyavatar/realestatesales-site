import Link from "next/link";
import { business, services } from "@/lib/data";
import { BoltLogo } from "./icons";

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="hazard" aria-hidden />
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <BoltLogo className="h-10 w-10" />
            <span className="display text-2xl text-white">
              Impulse <span className="text-brand">Electrical</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-white/60">
            A-Grade electricians based in {business.locality}, working the
            Peninsula for over ten years. {business.serviceAreaBlurb}.
          </p>
        </div>

        <div>
          <h3 className="font-condensed text-base font-semibold uppercase tracking-[0.14em] text-white/40">
            Services
          </h3>
          <ul className="mt-4 space-y-2 text-[15px]">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="text-white/80 transition hover:text-brand">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-condensed text-base font-semibold uppercase tracking-[0.14em] text-white/40">
            Contact
          </h3>
          <a href={business.phoneHref} className="phone-lockup mt-3 block text-3xl text-white transition hover:text-brand">
            {business.phone}
          </a>
          <p className="mt-1 font-condensed text-sm font-semibold uppercase tracking-[0.12em] text-brand">
            24/7 for emergencies
          </p>
          <a href={`mailto:${business.email}`} className="mt-4 block break-all text-[15px] text-white/80 transition hover:text-brand">
            {business.email}
          </a>
        </div>

        <div>
          <h3 className="font-condensed text-base font-semibold uppercase tracking-[0.14em] text-white/40">
            Licensed &amp; insured
          </h3>
          <ul className="mt-4 space-y-2 text-[15px] text-white/80">
            <li>{business.rec}</li>
            <li>{business.licence}</li>
            <li>{business.insurance}</li>
            <li>Certificate of Electrical Safety with every job</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-5 text-[13px] text-white/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {business.name}
          </p>
          <p>
            {business.rec} · {business.locality}, {business.region}
          </p>
        </div>
      </div>

      {/* Spacer so the fixed mobile call bar never covers footer content */}
      <div className="h-16 md:hidden" />
    </footer>
  );
}
