"use client";

import { motion } from "framer-motion";
import { QRCodeDownload } from "@/components/marketing/qr-code-download";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

const SOCIAL_PROOF = [
  { value: "12K+", label: "Dishes Ranked" },
  { value: "48K+", label: "Arguments Settled" },
  { value: "3", label: "Cities Live" },
];

export function CtaSection() {
  return (
    <section
      id="download"
      className="py-32 md:py-40 px-6 bg-bg flex flex-col items-center text-center overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl w-full space-y-12"
      >
        <div>
          <h2 className="font-display font-black italic text-5xl md:text-8xl tracking-tighter leading-none mb-4">
            The Argument&apos;s{" "}
            <span className="text-accent">Not Over.</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Someone in your city is wrong about the best dish. Download Forked
            and settle it.
          </p>
        </div>

        {IS_WAITLIST_MODE ? (
          <div className="flex items-center justify-center">
            <WaitlistForm source="cta" />
          </div>
        ) : (
          <>
            {/* Download options */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
              {/* iOS */}
              <a
                href="#"
                className="group bg-text-primary text-bg w-56 px-6 py-4 rounded-2xl hover:bg-accent hover:text-accent-on transition-all cursor-pointer flex items-center gap-4 text-left"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8 shrink-0 fill-current"
                  aria-hidden="true"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div>
                  <p className="text-[9px] font-bold tracking-[0.15em] uppercase opacity-70 group-hover:opacity-100">
                    Download on the
                  </p>
                  <p className="text-base font-black uppercase tracking-tight">
                    App Store
                  </p>
                </div>
              </a>

              {/* Android */}
              <a
                href="#"
                className="group bg-text-primary text-bg w-56 px-6 py-4 rounded-2xl hover:bg-accent hover:text-accent-on transition-all cursor-pointer flex items-center gap-4 text-left"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8 shrink-0 fill-current"
                  aria-hidden="true"
                >
                  <path d="M3.18 23.76c.3.17.66.19.99.04l12.45-6.89-2.65-2.65-10.79 9.5zm-1.64-20.2A1.45 1.45 0 001.5 4.5v15c0 .5.27.96.72 1.2l.09.05 8.4-8.4v-.2L1.63 3.59l-.09.03-.09.03v-.09zM20.24 10.4l-2.89-1.6-2.98 2.98 2.98 2.98 2.9-1.62c.83-.46.83-1.28 0-1.74zM3.18.24L15.63 7.13 12.98 9.78 2.19.28l-.1-.03-.1-.01h.01c.38 0 .76.09 1.08.28z" />
                </svg>
                <div>
                  <p className="text-[9px] font-bold tracking-[0.15em] uppercase opacity-70 group-hover:opacity-100">
                    Get it on
                  </p>
                  <p className="text-base font-black uppercase tracking-tight">
                    Google Play
                  </p>
                </div>
              </a>

              {/* QR Code */}
              <div className="bg-surface-2 border border-border p-5 rounded-2xl flex flex-col items-center justify-center w-56">
                <QRCodeDownload />
              </div>
            </div>

            {/* Social proof strip */}
            <div className="flex items-center justify-center gap-8 md:gap-14 pt-8 border-t border-border/60">
              {SOCIAL_PROOF.map((item, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-black font-display italic text-text-primary tabular-nums">
                    {item.value}
                  </p>
                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-text-tertiary mt-0.5">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </section>
  );
}
