interface InvestorPlaceholder {
  name: string;
}

const investors: InvestorPlaceholder[] = [
  { name: "Investor 1" },
  { name: "Investor 2" },
  { name: "Investor 3" },
  { name: "Investor 4" },
];

export function InvestorsSection() {
  return (
    <section className="text-center space-y-8">
      <div>
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[#FF4D00] mb-4">
          BACKED BY
        </p>
        <h2 className="font-display italic font-black text-3xl md:text-5xl tracking-tighter text-white">
          Our Investors
        </h2>
        <p className="text-white/40 mt-4 max-w-md mx-auto text-sm">
          Supported by people who believe food discovery deserves better.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-8">
        {investors.map((investor) => (
          <div
            key={investor.name}
            className="w-36 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center"
          >
            <span className="text-xs font-bold text-white/20 uppercase tracking-wider">
              {investor.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
