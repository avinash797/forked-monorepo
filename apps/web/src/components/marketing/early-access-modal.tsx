"use client";

import { useState, useTransition } from "react";
import { X, Check, Smartphone, Mail, Clock } from "lucide-react";
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { joinWaitlist } from "@/app/actions/waitlist-action";

interface EarlyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EarlyAccessModal({ isOpen, onClose }: EarlyAccessModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await joinWaitlist(email, "early-access-modal");
      setStatus(result.success ? "success" : "error");
      setMessage(result.message);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#18181A] border border-[#2E2E34] rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#242428] hover:bg-[#2E2E34] text-[#A3A3A3] hover:text-white flex items-center justify-center transition-colors focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          {IS_WAITLIST_MODE ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#26262B] text-[#E13B22] text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <Clock className="w-3.5 h-3.5" />
              Private Beta &bull; In Testing
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#26262B] text-[#E13B22] text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <Smartphone className="w-3.5 h-3.5" />
              Available Now
            </div>
          )}

          <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mb-2">
            {IS_WAITLIST_MODE ? "Join Early Access Beta." : "Download Forked."}
          </h3>

          <p className="text-xs sm:text-sm text-[#A3A3A3] mb-6 leading-relaxed">
            {IS_WAITLIST_MODE
              ? "Core features and battle engines are finalized and currently in private testing. Reserve your spot for the next invite wave."
              : "Settle the food debates with head-to-head battles. Download on iOS or Android below, or join the email waitlist for beta dish drops."}
          </p>

          {IS_WAITLIST_MODE ? (
            <div>
              {status === "success" ? (
                <div className="p-4 rounded-2xl bg-[#202024] border border-[#E13B22]/50 text-center animate-in fade-in">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#E13B22] text-white mb-2">
                    <Check className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-bold text-base text-white">
                    {message}
                  </h4>
                  <button
                    onClick={onClose}
                    className="mt-3 px-4 py-2 rounded-xl bg-white text-[#121212] font-display font-bold text-xs hover:bg-[#F3EFEA]"
                  >
                    Got It
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 mb-6">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#A3A3A3] mb-1.5">
                      Enter your email for private beta access
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === "error") setStatus("idle");
                      }}
                      placeholder="you@domain.com"
                      className="w-full px-4 py-3 rounded-xl bg-[#202024] border border-[#333338] text-white placeholder-[#737373] text-xs focus:outline-none focus:border-[#E13B22]"
                    />
                  </div>
                  {status === "error" && (
                    <p className="text-red-400 text-xs font-bold">{message}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 px-4 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white font-display font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-60"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isPending ? "Submitting..." : "Request Early Access Invite"}</span>
                  </button>
                </form>
              )}

              <div className="relative flex items-center justify-center my-5">
                <div className="w-full border-t border-[#2E2E34]" />
                <span className="absolute px-2.5 bg-[#18181A] text-[10px] font-mono uppercase text-[#737373]">
                  App Store & Play Store
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 opacity-80">
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#202024] border border-[#2E2E34] text-left">
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase font-mono tracking-wider text-[#E13B22]">
                      In Testing
                    </div>
                    <div className="font-display font-bold text-xs text-white truncate">
                      iOS TestFlight
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#202024] border border-[#2E2E34] text-left">
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase font-mono tracking-wider text-[#E13B22]">
                      In Testing
                    </div>
                    <div className="font-display font-bold text-xs text-white truncate">
                      Play Beta
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white text-[#121212] hover:bg-[#F3EFEA] transition-all shadow-md active:scale-95"
                >
                  <div className="text-left min-w-0">
                    <div className="text-[9px] uppercase font-mono tracking-wider text-[#737373] leading-none">
                      App Store
                    </div>
                    <div className="font-display font-black text-xs text-[#121212] truncate">
                      Download iOS
                    </div>
                  </div>
                </a>
                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#222226] hover:bg-[#2A2A30] border border-[#333338] text-white transition-all shadow-md active:scale-95"
                >
                  <div className="text-left min-w-0">
                    <div className="text-[9px] uppercase font-mono tracking-wider text-[#A3A3A3] leading-none">
                      Google Play
                    </div>
                    <div className="font-display font-black text-xs text-white truncate">
                      Get Android
                    </div>
                  </div>
                </a>
              </div>

              <div className="relative flex items-center justify-center my-5">
                <div className="w-full border-t border-[#2E2E34]" />
                <span className="absolute px-2.5 bg-[#18181A] text-[10px] font-mono uppercase text-[#737373]">
                  or join email list
                </span>
              </div>

              {status === "success" ? (
                <div className="p-4 rounded-2xl bg-[#202024] border border-[#E13B22]/50 text-center animate-in fade-in">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#E13B22] text-white mb-2">
                    <Check className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-bold text-base text-white">
                    {message}
                  </h4>
                  <button
                    onClick={onClose}
                    className="mt-3 px-4 py-2 rounded-xl bg-white text-[#121212] font-display font-bold text-xs hover:bg-[#F3EFEA]"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="Enter your email for new dish tournaments..."
                    className="w-full px-4 py-3 rounded-xl bg-[#202024] border border-[#333338] text-white placeholder-[#737373] text-xs focus:outline-none focus:border-[#E13B22]"
                  />
                  {status === "error" && (
                    <p className="text-red-400 text-xs font-bold">{message}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 px-4 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white font-display font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-60"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isPending ? "Submitting..." : "Join Email Digest"}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-5 text-center text-[10px] font-mono text-[#737373]">
            Zero Star Averages &bull; Strictly Like-for-Like Dish Battles
          </div>
        </div>
      </div>
    </div>
  );
}
