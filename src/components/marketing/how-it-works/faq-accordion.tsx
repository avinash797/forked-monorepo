"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { track } from "@vercel/analytics";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "Why Elo instead of a 5-point scale?",
    answer:
      "Traditional rating scales are noisy and inflated — most dishes cluster around 4.2. Elo uses head-to-head comparisons, which are faster, more intuitive, and produce much more granular rankings. You don't need to decide if something is a 3.7 or a 3.8 — you just pick which dish you liked better.",
  },
  {
    question: "Why are photos mandatory?",
    answer:
      "Because anyone can leave a number. Not everyone can prove they showed up. A photo means you sat down, ordered the dish, and ate it. It's the minimum bar for honesty — and it makes the leaderboard look incredible.",
  },
  {
    question: "How many battles does a dish need to be ranked?",
    answer:
      "A dish needs a minimum number of battles before it appears on public leaderboards. This ensures rankings are statistically meaningful, not just based on one or two opinions. The more battles, the higher the confidence score — and the harder it is to knock the top dish off its perch.",
  },
  {
    question: "Can restaurants pay to boost their ranking?",
    answer:
      "No. Rankings are 100% algorithmic and based on real user battles. There is no pay-to-play, no sponsored placements, and no editorial override. The only way to climb the leaderboard is to serve better food.",
  },
  {
    question: "Is Forked available in my city?",
    answer:
      "We launched in New Orleans and are expanding to new cities based on demand. We prioritize cities where the argument is already happening — where locals are already debating the best dish. Download the app and start rating. Active communities get cities first.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  return (
    <section ref={ref} className="space-y-8">
      <motion.div
        className="text-center"
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-accent mb-4">
          FAQ
        </p>
        <h2 className="font-display italic font-black text-3xl md:text-5xl tracking-tighter text-text-primary">
          Common Questions
        </h2>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-3">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            className="border border-border rounded-xl overflow-hidden"
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
          >
            <button
              onClick={() => {
                if (openIndex !== i)
                  track("faq_open", { question: faq.question });
                setOpenIndex(openIndex === i ? null : i);
              }}
              aria-expanded={openIndex === i}
              aria-controls={`faq-answer-${i}`}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <span className="text-sm font-bold text-text-primary pr-4">
                {faq.question}
              </span>
              {openIndex === i ? (
                <Minus
                  size={16}
                  className="text-accent shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <Plus
                  size={16}
                  className="text-text-tertiary shrink-0"
                  aria-hidden="true"
                />
              )}
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="px-5 pb-5 text-sm text-text-secondary leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
