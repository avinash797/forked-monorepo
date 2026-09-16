"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FAQS } from "@/data/marketing-mock";

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIdx(openIdx === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 bg-bg border-b border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-text-primary text-bg text-xs font-mono font-medium uppercase tracking-widest mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-accent" />
            Honest Answers
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-text-primary tracking-tight leading-tight mb-4">
            Frequently Asked Questions.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary">
            Straightforward answers about our math, our stance on stars, and why dishes come first.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIdx === index;
            return (
              <div
                key={faq.q}
                className="bg-surface rounded-2xl border border-border overflow-hidden transition-all shadow-2xs"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 hover:bg-surface-2 transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-display font-black text-base sm:text-lg text-text-primary">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-text-primary text-bg' : 'text-text-tertiary'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 pt-1 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-border">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
