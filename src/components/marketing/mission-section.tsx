const statements = [
  "Make food decision fatigue obsolete.",
  "Drop the curtains from fancy restaurants.",
  "Spotlight hole-in-the-wall gems.",
  "Push chefs to compete and perfect their craft.",
];

export function MissionSection() {
  return (
    <section className="py-20 sm:py-28 bg-[#221610]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-sm font-semibold text-[#ee6c2b] uppercase tracking-widest text-center mb-12">
          The Mission
        </h2>

        <div className="space-y-8">
          {statements.map((statement, i) => (
            <p
              key={i}
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center leading-tight"
            >
              {statement}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
