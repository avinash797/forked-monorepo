import { MessageSquare, ArrowRight, AlertCircle } from "lucide-react";
import { SUBREDDIT_RECEIPTS } from "@/data/marketing-mock";

export function SubredditReceipts() {
  return (
    <section id="receipts" className="py-16 sm:py-24 bg-bg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-text-primary text-bg text-xs font-mono font-medium uppercase tracking-widest mb-3">
            <MessageSquare className="w-3.5 h-3.5 text-accent" />
            Origin Story
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-text-primary tracking-tight leading-tight mb-3">
            The endless comment loop that founded Forked.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Every week, someone asks for the city&apos;s best po&apos;boy or slice. 200+ repetitive comments, same 4 spots shouted back and forth, and zero clear answer. Forked was built to end that comment scroll.
          </p>
        </div>

        {/* The 3 Debates & Problem Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {SUBREDDIT_RECEIPTS.map((receipt) => (
            <div
              key={receipt.id}
              className="bg-surface rounded-3xl border border-border p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-text-primary transition-colors"
            >
              <div>
                {/* Forum Thread Header with frequency badge */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-border mb-4 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-accent">{receipt.subreddit}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-text-secondary border border-border">
                    {receipt.frequencyTag}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-text-tertiary mb-2 font-medium">
                  {receipt.upvotes} upvotes • {receipt.commentCount} comments, 100 conflicting answers
                </div>

                {/* Question */}
                <h4 className="font-display font-black text-lg text-text-primary leading-snug mb-3">
                  &quot;{receipt.title}&quot;
                </h4>

                {/* OP Excerpt */}
                <div className="bg-surface-2 p-3 rounded-xl border border-border mb-3.5">
                  <div className="text-[10px] font-mono uppercase text-text-tertiary font-bold tracking-wider mb-1">
                    The Recurring Question:
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    &quot;{receipt.originalPost}&quot;
                  </p>
                </div>

                {/* The 100+ Comment Chaos */}
                <div className="mb-6 bg-[#FAF6F0] p-3.5 rounded-xl border border-[#E8DFC8]">
                  <div className="text-[10px] font-mono uppercase text-[#C02A14] font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#E13B22] shrink-0" />
                    The 100+ Comment Scroll:
                  </div>
                  <p className="text-xs text-[#262626] leading-relaxed font-medium">
                    {receipt.commentChaos}
                  </p>
                </div>
              </div>

              {/* Persona Quote */}
              <div className="pt-4 border-t border-border bg-bg -mx-6 -mb-6 p-6 rounded-b-3xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-text-primary text-bg flex items-center justify-center font-display font-bold text-xs">
                    {receipt.persona.name[0]}
                  </div>
                  <div>
                    <div className="font-display font-black text-xs text-text-primary">
                      {receipt.persona.name}
                    </div>
                    <div className="text-[10px] text-text-tertiary">
                      {receipt.persona.role} • {receipt.persona.location}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-text-secondary italic leading-relaxed">
                  &quot;{receipt.persona.quote}&quot;
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* Origin Catalyst Box */}
        <div className="mt-12 bg-[#121212] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-mono uppercase text-[#E13B22] font-bold tracking-widest mb-1 block">
              Why Forked Was Founded
            </span>
            <h3 className="font-display font-black text-xl sm:text-2xl text-white mb-2">
              Nobody should scroll through 300 comments to pick lunch.
            </h3>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
              Same question. Same four spots shouted back and forth. Still no decision. Forked turns comment exhaustion into an undisputed dish leaderboard.
            </p>
          </div>

          <a
            href="#leaderboards"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#121212] hover:bg-[#E13B22] hover:text-white font-display font-bold text-sm transition-all shrink-0 shadow-md"
          >
            <span>View The Dish Leaderboards</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
}
