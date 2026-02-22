"use client";

import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";
import { QRCodeDownload } from "@/components/marketing/qr-code-download";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

export function CtaSection() {
  return (
    <section
      id="download"
      className="py-32 md:py-40 px-6 bg-bg flex flex-col items-center text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        className="max-w-3xl space-y-12"
      >
        <h2 className="font-display font-black italic text-5xl md:text-8xl tracking-tighter leading-none">
          Ready to <span className="text-accent">Fork?</span>
        </h2>

        {IS_WAITLIST_MODE ? (
          <div className="flex items-center justify-center">
            <WaitlistForm source="cta" />
          </div>
        ) : (
          <>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Download Forked today and start pushing the best dishes to the top
              of the leaderboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-wrap">
              <a
                href="#"
                className="bg-surface-2 border border-border p-6 rounded-3xl backdrop-blur-xl w-64 group hover:bg-accent hover:border-accent transition-all cursor-pointer text-center"
              >
                <Smartphone
                  size={32}
                  className="mx-auto mb-4 group-hover:scale-110 transition-transform"
                />
                <p className="text-[10px] font-black tracking-widest mb-1 text-text-tertiary group-hover:text-accent-on">
                  DOWNLOAD
                </p>
                <h4 className="text-lg font-black uppercase">Get it for iOS</h4>
              </a>
              <a
                href="#"
                className="bg-surface-2 border border-border p-6 rounded-3xl backdrop-blur-xl w-64 group hover:bg-accent hover:border-accent transition-all cursor-pointer text-center"
              >
                <Smartphone
                  size={32}
                  className="mx-auto mb-4 group-hover:scale-110 transition-transform"
                />
                <p className="text-[10px] font-black tracking-widest mb-1 text-text-tertiary group-hover:text-accent-on">
                  DOWNLOAD
                </p>
                <h4 className="text-lg font-black uppercase">
                  Get it for Android
                </h4>
              </a>
              <div className="bg-surface-2 border border-border p-6 rounded-3xl backdrop-blur-xl w-64 flex flex-col items-center justify-center">
                <QRCodeDownload />
              </div>
            </div>
          </>
        )}
      </motion.div>
    </section>
  );
}
