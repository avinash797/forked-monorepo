const steps = [
  {
    number: "1",
    emoji: "🍽️",
    title: "Eat",
    description: "Try a dish worth rating at any restaurant in your city.",
  },
  {
    number: "2",
    emoji: "📸",
    title: "Snap",
    description: "Take a mandatory photo. No photo, no rating. This is your proof.",
  },
  {
    number: "3",
    emoji: "⚔️",
    title: "Compare",
    description:
      '"This vs That" — pick the winner in head-to-head dish battles.',
  },
  {
    number: "4",
    emoji: "🏆",
    title: "Rank",
    description:
      "Elo-powered leaderboards update in real-time. The cream rises to the top.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-28 bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-4">
          EAT. SNAP. COMPARE. RANK.
        </h2>
        <p className="text-text-secondary text-center max-w-2xl mx-auto mb-16">
          Four simple steps to find the best food in your city.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <span className="text-3xl">{step.emoji}</span>
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center left-1/2 ml-4">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
