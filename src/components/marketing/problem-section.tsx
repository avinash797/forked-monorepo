import { Card } from "@/components/ui/card";

const problems = [
  {
    icon: "?",
    title: "Google reviews are misleading",
    description:
      "4.5 stars means nothing when every place has 4.5 stars. You need specifics, not averages.",
  },
  {
    icon: "X",
    title: "Critics disagree with your taste",
    description:
      "What a food writer loves and what you love are different things. Their palate isn't yours.",
  },
  {
    icon: "!",
    title: "Hidden gems stay hidden",
    description:
      "The best dishes are at places with bad parking and no Instagram. Nobody's ranking the actual food.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 sm:py-28 bg-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-4">
          The Best Burger Might Be at a Steakhouse
        </h2>
        <p className="text-text-secondary text-center max-w-2xl mx-auto mb-16">
          Current food discovery is broken. Here&apos;s why.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((problem) => (
            <Card key={problem.title} className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent font-bold text-xl flex items-center justify-center mx-auto mb-4">
                {problem.icon}
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {problem.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {problem.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
