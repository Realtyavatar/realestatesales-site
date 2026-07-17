import Link from "next/link";
import { business, services } from "@/lib/data";
import { BoltLogo, Icon } from "./icons";

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5 font-extrabold">
            <BoltLogo className="h-9 w-9" />
            <span className="text-lg">
              Impulse <span className="text-brand">Electrical</span>
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Local A-Grade electricians serving the Mornington Peninsula for over
            ten years. Residential, commercial and genuine 24/7 emergency
            call-outs.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Services</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
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
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={business.phoneHref} className="flex items-center gap-2.5 font-semibold text-white transition hover:text-brand">
                <Icon name="phone" className="h-4 w-4 shrink-0 text-brand" />
                {business.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${business.email}`} className="flex items-center gap-2.5 text-white/80 transition hover:text-brand">
                <Icon name="mail" className="h-4 w-4 shrink-0 text-brand" />
                {business.email}
              </a>
            </li>
            <li className="flex items-center gap-2.5 text-white/80">
              <Icon name="pin" className="h-4 w-4 shrink-0 text-brand" />
              {business.serviceAreaBlurb}
            </li>
            <li className="flex items-center gap-2.5 text-white/80">
              <Icon name="clock" className="h-4 w-4 shrink-0 text-brand" />
              24/7 emergency call-outs
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Licensed &amp; Insured</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/80">
            <li>{business.rec}</li>
            <li>{business.licence}</li>
            <li>{business.insurance}</li>
            <li>Certificate of Electrical Safety with every job</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {business.name}. All rights reserved.
          </p>
          <p>
            {business.rec} · {business.locality}, {business.region}
          </p>
        </div>
      </div>

      {/* Spacer so the sticky mobile call bar never covers footer content */}
      <div className="h-16 md:hidden" />
    </footer>
  );
}
