import { Check, X, Flame, ShieldAlert, Award, Scale } from 'lucide-react';
import { COMPARISON_DATA } from "@/data/marketing-mock";

export function AntiSlopComparison() {
  return (
    <section id="compare" className="py-16 sm:py-24 bg-[#121212] text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#242428] text-[#E13B22] text-xs font-mono font-bold tracking-widest uppercase mb-3">
            <Scale className="w-3.5 h-3.5" />
            Category Reframe
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight text-white mb-3">
            How Forked Compares.
          </h2>
          <p className="text-sm sm:text-base text-[#A3A3A3] leading-relaxed">
            Other apps rank venues. Influencers rank free meals. Forked battles dishes head-to-head for a public city verdict.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="min-w-[760px] rounded-3xl border border-[#2E2E34] bg-[#18181A] overflow-hidden shadow-2xl">

            {/* Table Header */}
            <div className="grid grid-cols-12 bg-[#202024] p-4 sm:p-5 border-b border-[#2E2E34] text-xs font-mono uppercase tracking-wider text-[#A3A3A3]">
              <div className="col-span-3 text-white font-bold">Evaluation Criteria</div>
              <div className="col-span-3 text-[#E13B22] font-black flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E13B22]" />
                <span>FORKED</span>
              </div>
              <div className="col-span-2 text-[#D4D4D4]">Beli</div>
              <div className="col-span-2 text-[#D4D4D4]">Google / Yelp</div>
              <div className="col-span-2 text-[#D4D4D4]">Food Influencers</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#26262B]">
              {COMPARISON_DATA.map((row, idx) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-12 p-4 sm:p-5 items-center text-xs sm:text-sm transition-colors ${
                    idx % 2 === 0 ? 'bg-[#18181A]' : 'bg-[#1C1C1E]'
                  }`}
                >
                  {/* Criteria */}
                  <div className="col-span-3 font-display font-bold text-white pr-3">
                    {row.feature}
                  </div>

                  {/* Forked */}
                  <div className="col-span-3 pr-3 text-white font-semibold">
                    <div className="inline-flex items-center gap-1.5 text-xs text-[#E13B22] font-bold bg-[#E13B22]/10 border border-[#E13B22]/30 px-2 py-1 rounded-md mb-1">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{row.forked}</span>
                    </div>
                  </div>

                  {/* Beli */}
                  <div className="col-span-2 pr-3 text-[#A3A3A3] text-xs leading-snug">
                    {row.beli}
                  </div>

                  {/* Google / Yelp */}
                  <div className="col-span-2 pr-3 text-[#A3A3A3] text-xs leading-snug">
                    {row.googleYelp}
                  </div>

                  {/* Influencers */}
                  <div className="col-span-2 text-[#737373] text-xs leading-snug">
                    {row.influencers}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Quote Callout directly from brand doc */}
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-[#1C1C1E] border border-[#2E2E34] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-[#D4D4D4]">
            <strong className="text-white font-display">&quot;Beli ranks venues; Google averages parking complaints.</strong>{' '}
            Forked battles like-for-like dishes and publishes the city&apos;s real answer.&quot;
          </div>
          <a
            href="#leaderboards"
            className="px-4 py-2 rounded-xl bg-[#E13B22] hover:bg-[#C02A14] text-white text-xs font-bold font-display whitespace-nowrap transition-colors"
          >
            View Leaderboards →
          </a>
        </div>

      </div>
    </section>
  );
}
