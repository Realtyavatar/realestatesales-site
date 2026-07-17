"use client";

import { useState } from "react";
import { business, services } from "@/lib/data";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/enquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Something went wrong sending your enquiry.");
      }
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "sent") {
    return (
      <div className="card bg-gray-50 p-8 text-center">
        <h3 className="text-xl font-extrabold">Thanks — we’ve got it.</h3>
        <p className="mt-2 text-navy/70">
          We’ll get back to you as soon as possible. If it’s urgent, call{" "}
          <a href={business.phoneHref} className="font-bold text-brand">
            {business.phone}
          </a>{" "}
          — we answer 24/7.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            Name *
          </label>
          <input id="name" name="name" required autoComplete="name" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className="field"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="suburb">
            Suburb
          </label>
          <input id="suburb" name="suburb" autoComplete="address-level2" className="field" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="service">
          What do you need?
        </label>
        <select id="service" name="service" className="field" defaultValue="">
          <option value="">Select a service (optional)</option>
          {services.map((s) => (
            <option key={s.slug} value={s.title}>
              {s.title}
            </option>
          ))}
          <option value="Something else">Something else</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="message">
          Tell us about the job *
        </label>
        <textarea id="message" name="message" required rows={4} className="field" />
      </div>
      {status === "error" && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error} You can also call {business.phone} or email {business.email}.
        </p>
      )}
      <button type="submit" disabled={status === "sending"} className="btn-primary w-full disabled:opacity-50">
        {status === "sending" ? "Sending…" : "Send enquiry"}
      </button>
      <p className="text-center text-xs text-navy/50">
        We only use your details to respond to this enquiry.
      </p>
    </form>
  );
}
