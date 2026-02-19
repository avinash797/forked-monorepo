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
      className="py-32 md:py-40 px-6 bg-black flex flex-col items-center text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        className="max-w-3xl space-y-12"
      >
        <h2 className="font-display font-black italic text-5xl md:text-8xl tracking-tighter leading-none">
          Ready to <span className="text-[#FF4D00]">Fork?</span>
        </h2>

        {IS_WAITLIST_MODE ? (
          <div className="flex items-center justify-center">
            <WaitlistForm source="cta" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-wrap">
            <a
              href="#"
              className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl w-64 group hover:bg-[#FF4D00] hover:border-[#FF4D00] transition-all cursor-pointer text-center"
            >
              <Smartphone
                size={32}
                className="mx-auto mb-4 group-hover:scale-110 transition-transform"
              />
              <p className="text-[10px] font-black tracking-widest mb-1 text-white/60 group-hover:text-white/80">
                DOWNLOAD ON THE
              </p>
              <h4 className="text-lg font-black uppercase">App Store</h4>
            </a>
            <a
              href="#"
              className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl w-64 group hover:bg-[#FF4D00] hover:border-[#FF4D00] transition-all cursor-pointer text-center"
            >
              <Smartphone
                size={32}
                className="mx-auto mb-4 group-hover:scale-110 transition-transform"
              />
              <p className="text-[10px] font-black tracking-widest mb-1 text-white/60 group-hover:text-white/80">
                GET IT ON
              </p>
              <h4 className="text-lg font-black uppercase">Google Play</h4>
            </a>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl w-64 flex flex-col items-center justify-center">
              <QRCodeDownload />
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
}
