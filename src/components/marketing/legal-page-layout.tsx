interface LegalPageLayoutProps {
  title: string;
  effectiveDate: string;
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  effectiveDate,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="mb-12">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-accent mb-4">
          LEGAL
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display italic font-black tracking-tighter text-text-primary mb-4">
          {title}
        </h1>
        <span className="inline-block text-xs font-bold tracking-wider uppercase text-text-tertiary bg-surface2 px-3 py-1 rounded-full">
          Effective {effectiveDate}
        </span>
      </div>
      <div className="prose prose-lg max-w-none space-y-8 text-text-secondary text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}
