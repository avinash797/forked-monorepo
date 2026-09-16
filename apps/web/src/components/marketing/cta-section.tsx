import { useState, useTransition } from "react";
import { ArrowRight, Check, Smartphone, Flame, Clock, Mail } from 'lucide-react';
import { IS_WAITLIST_MODE } from "@/lib/waitlist";
import { joinWaitlist } from "@/app/actions/waitlist-action";

interface CtaSectionProps {
  onOpenEarlyAccess: () => void;
}

export function CtaSection({ onOpenEarlyAccess }: CtaSectionProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await joinWaitlist(email, "cta-section");
      setStatus(result.success ? "success" : "error");
      setMessage(result.message);
    });
  };

  return (
    <section className="py-20 sm:py-28 bg-[#121212] text-white relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E13B22]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#E13B22]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#262626] text-[#E13B22] text-xs font-mono font-bold tracking-widest uppercase mb-6 shadow-sm">
          {IS_WAITLIST_MODE ? (
            <>
              <Clock className="w-3.5 h-3.5" />
              Private Beta In Progress
            </>
          ) : (
            <>
              <Flame className="w-3.5 h-3.5" />
              Join The Ranks
            </>
          )}
        </div>

        {/* Heading */}
        <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.05] text-white mb-6">
          {IS_WAITLIST_MODE ? (
            <>
              Features are finalized. <br />
              <span className="text-[#E13B22]">Get on the early access list.</span>
            </>
          ) : (
            <>
              Stop arguing in comments. <br />
              <span className="text-[#E13B22]">Start keeping score.</span>
            </>
          )}
        </h2>

        <p className="text-base sm:text-lg text-[#D4D4D4] max-w-xl mx-auto mb-10 leading-relaxed">
          {IS_WAITLIST_MODE
            ? "Private beta testing is underway. Join the waitlist for the next cohort drop."
            : "Next time someone asks for the city's best slice, drop the Forked link. Let the battle math talk."}
        </p>

        {IS_WAITLIST_MODE ? (
          /* Waitlist First Mode */
          <div className="max-w-md mx-auto mb-12">
            {status === "success" ? (
              <div className="p-5 rounded-2xl bg-[#1E1E22] border border-[#E13B22]/50 text-center animate-in fade-in zoom-in-95">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#E13B22] text-white mb-2">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-lg text-white">
                  You’re on the waitlist!
                </h4>
                <p className="text-xs text-[#A3A3A3] mt-1">
                  {message}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email for beta invite..."
                  className="flex-1 px-4 py-3.5 rounded-xl bg-[#202024] border border-[#333338] text-white placeholder-[#737373] text-sm focus:outline-none focus:border-[#E13B22] transition-colors"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-3.5 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                >
                  <Mail className="w-4 h-4" />
                  <span>{isPending ? "Submitting..." : "Request Invite"}</span>
                </button>
              </form>
            )}
            {status === "error" && <p className="text-red-400 text-xs font-bold mt-2">{message}</p>}

            {/* App Store Status in Testing */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={onOpenEarlyAccess}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#1C1C20] border border-[#2E2E34] text-left hover:border-[#E13B22]/60 transition-colors"
              >
                <svg className="w-5 h-5 fill-current text-[#A3A3A3]" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.9.04-2.02.61-2.67 1.36-.58.68-1.09 1.74-.95 2.78 1.02.08 2.08-.52 2.7-1.27z" />
                </svg>
                <div>
                  <div className="text-[9px] uppercase font-mono text-[#E13B22]">Releasing Soon</div>
                  <div className="text-xs font-bold text-white">Apple App Store</div>
                </div>
              </button>

              <button
                onClick={onOpenEarlyAccess}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#1C1C20] border border-[#2E2E34] text-left hover:border-[#E13B22]/60 transition-colors"
              >
                <svg className="w-5 h-5 fill-current text-[#A3A3A3]" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.44 1.44 0 0 1-.22-.767V2.581c0-.284.08-.553.219-.767zm11.242 11.245l2.45 2.45-12.06 6.945 9.61-9.395zm0-2.118l-9.61-9.395 12.06 6.945-2.45 2.45zM15.96 12l2.955-1.703a1.439 1.439 0 0 1 0 2.49L15.96 12z" />
                </svg>
                <div>
                  <div className="text-[9px] uppercase font-mono text-[#E13B22]">Releasing Soon</div>
                  <div className="text-xs font-bold text-white">Google Play Store</div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Live Store Download Buttons Mode */
          <>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white text-[#121212] hover:bg-[#F3EFEA] transition-all shadow-md active:scale-95 group"
              >
                <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.9.04-2.02.61-2.67 1.36-.58.68-1.09 1.74-.95 2.78 1.02.08 2.08-.52 2.7-1.27z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#737373] leading-none">
                    Download on the
                  </div>
                  <div className="font-display font-black text-base leading-tight text-[#121212]">
                    Apple App Store
                  </div>
                </div>
              </a>

              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#202024] hover:bg-[#28282E] border border-[#333338] text-white transition-all shadow-md active:scale-95 group"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.44 1.44 0 0 1-.22-.767V2.581c0-.284.08-.553.219-.767zm11.242 11.245l2.45 2.45-12.06 6.945 9.61-9.395zm0-2.118l-9.61-9.395 12.06 6.945-2.45 2.45zM15.96 12l2.955-1.703a1.439 1.439 0 0 1 0 2.49L15.96 12z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#A3A3A3] leading-none">
                    Get it on
                  </div>
                  <div className="font-display font-black text-base leading-tight text-white">
                    Google Play
                  </div>
                </div>
              </a>
            </div>

            {/* Digest Email */}
            <div className="max-w-md mx-auto mb-8">
              <div className="text-xs font-mono text-[#A3A3A3] mb-3 uppercase tracking-wider">
                Or join the email digest for new dish tournaments & city drops:
              </div>
              {status === "success" ? (
                <div className="p-4 rounded-2xl bg-[#1E1E22] border border-[#E13B22]/50 text-center animate-in fade-in zoom-in-95">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#E13B22] text-white mb-2">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="font-display font-bold text-lg text-white">
                    You’re on the list!
                  </h4>
                  <p className="text-xs text-[#A3A3A3] mt-1">
                    {message}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email for weekly dish drops..."
                    className="flex-1 px-4 py-3.5 rounded-xl bg-[#202024] border border-[#333338] text-white placeholder-[#737373] text-sm focus:outline-none focus:border-[#E13B22] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-3.5 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <span>{isPending ? "Submitting..." : "Join Digest"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
              {status === "error" && <p className="text-red-400 text-xs font-bold mt-2">{message}</p>}
            </div>
          </>
        )}

        {/* Platform Availabilities */}
        <div className="mt-8 pt-6 border-t border-[#26262B] flex flex-wrap items-center justify-center gap-6 text-xs text-[#8E8E93] font-mono">
          <span className="flex items-center gap-1.5 text-white">
            <Smartphone className="w-4 h-4 text-[#E13B22]" />
            {IS_WAITLIST_MODE ? 'Releasing Soon on iOS & Android' : 'Available on iOS & Android'}
          </span>
          <span>•</span>
          <span>Zero Star Averages</span>
          <span>•</span>
          <span>{IS_WAITLIST_MODE ? 'Private Beta Cohorts' : 'Free to download & rank'}</span>
        </div>

      </div>
    </section>
  );
}
