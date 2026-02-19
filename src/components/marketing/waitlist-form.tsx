"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { joinWaitlist } from "@/app/actions/waitlist-action";

interface WaitlistFormProps {
  source?: string;
}

export function WaitlistForm({ source }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await joinWaitlist(email, source);
      setStatus(result.success ? "success" : "error");
      setMessage(result.message);
      if (result.success) setEmail("");
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-4 text-green-400"
          >
            <CheckCircle size={20} className="shrink-0" />
            <p className="text-sm font-bold tracking-wide">{message}</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="relative flex items-center"
          >
            <div className="relative flex-1">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="Enter your email"
                required
                className="w-full bg-surface-2 border border-border rounded-l-2xl pl-12 pr-4 py-4 text-text-primary text-sm font-medium placeholder:text-text-tertiary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="bg-accent text-accent-on px-6 py-4 rounded-r-2xl font-black text-sm tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_5px_20px_rgba(238,108,43,0.3)] whitespace-nowrap"
            >
              {isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  JOIN
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Error message */}
      {status === "error" && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-3 text-red-400 text-xs font-bold"
        >
          <AlertCircle size={14} />
          {message}
        </motion.div>
      )}
    </div>
  );
}
