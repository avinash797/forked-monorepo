import { ForkLogo } from "@/components/icons/fork-logo";

export function CtaSection() {
  return (
    <section
      id="download"
      className="py-20 sm:py-28 bg-gradient-to-b from-[#342219] to-[#221610]"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <ForkLogo size={56} color="#FBBF24" className="mx-auto mb-6" />

        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to Find the Best Dish in Your City?
        </h2>
        <p className="text-lg text-[#c9a492] mb-10 max-w-xl mx-auto">
          Download Forked and start rating. Your taste matters.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#"
            className="inline-flex items-center gap-3 bg-white text-[#221610] px-6 py-4 rounded-xl text-base font-semibold hover:bg-gray-100 transition-colors"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Download for iOS
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-3 bg-white text-[#221610] px-6 py-4 rounded-xl text-base font-semibold hover:bg-gray-100 transition-colors"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
            </svg>
            Download for Android
          </a>
        </div>
      </div>
    </section>
  );
}
