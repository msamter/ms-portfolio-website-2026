import React, { useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CASE_STUDIES, QA_ITEMS } from '../data/projects';
import { FitDisplayHeadline } from '../components/FitDisplayHeadline';
import { BackspaceText } from '../components/BackspaceText';
import { isModifiedEvent, withBase } from '../utils/paths';
import { usePortfolioAnalytics } from '../hooks/usePortfolioAnalytics';

interface HomeViewProps {
  onNavigate: (path: string) => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const HERO_TRANSITION = { duration: 0.42, ease: EASE } as const;
const SECTION_TRANSITION = { duration: 0.4, ease: EASE } as const;
const VIEWPORT_ONCE = { once: true, amount: 'some' as const } as const;

const INTRO_PHRASES = [
  'Passionate about research.',
  'Passionate about people and behavior.',
  'Passionate about people and design.',
];

function getWellbeHeroPath(): string {
  return CASE_STUDIES[0]?.heroImages?.src ?? 'assets/wellbe-work-1604.webp';
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { trackWorkProjectClick } = usePortfolioAnalytics();
  const featuredProject = CASE_STUDIES[0];
  const prefetchedCaseStudyHero = useRef(false);

  const prefetchCaseStudyHero = useCallback(() => {
    if (!prefetchedCaseStudyHero.current) {
      prefetchedCaseStudyHero.current = true;
      // Warm the lazy CaseStudyView chunk so clicking WELLBE+ renders with zero Suspense flash
      import('./CaseStudyView').catch(() => {});
      const img = new Image();
      img.decoding = 'async';
      img.src = withBase(getWellbeHeroPath());
      img.decode?.().catch(() => {});
    }
  }, []);

  // Quietly warm the lightweight WELLBE+ hero WebP after Home paint so navigating feels instant on mobile & desktop
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(() => prefetchCaseStudyHero(), { timeout: 1500 });
      return () => win.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(prefetchCaseStudyHero, 900);
    return () => window.clearTimeout(timer);
  }, [prefetchCaseStudyHero]);

  return (
    <div className="w-full">
      {/* Hero Headline & Tagline */}
      <section className="mx-auto max-w-[1100px] px-5 pt-8 sm:px-10 sm:pt-14 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={HERO_TRANSITION}
          className="w-full text-center"
        >
          <FitDisplayHeadline
            text="MICAH SAMTER"
            letterSpacing="0.045em"
            wordSpacing="0.06em"
            heightScale={1.2}
            reservedAspectRatio={3.948}
          />

          <p className="mt-8 sm:mt-11 min-h-[3.2em] sm:min-h-[1.6em] text-[1rem] sm:text-[1.08rem] leading-[1.45] font-medium tracking-[-0.01em] text-ink">
            <BackspaceText
              phrases={INTRO_PHRASES}
              typeSpeed={44}
              deleteSpeed={26}
              pauseDuration={820}
              startDelay={300}
              loop={false}
              cursor="line"
              hideCursorOnComplete={true}
            />
          </p>
        </motion.div>
      </section>

      {/* Framed UX Case Study Aligned With Navbar */}
      <div
        id="selected-work"
        className="mx-auto mt-9 max-w-[1100px] scroll-mt-20 px-5 sm:mt-14 sm:scroll-mt-28 sm:px-10"
      >
        <article aria-label="Featured Case Study">
          <a
            href={withBase('/Work')}
            onFocus={prefetchCaseStudyHero}
            onPointerDown={prefetchCaseStudyHero}
            onPointerEnter={prefetchCaseStudyHero}
            onAuxClick={(e) => {
              if (e.button !== 1) return;
              trackWorkProjectClick({
                project: featuredProject.displayTitle,
                slug: featuredProject.slug,
                location: 'home_featured_card',
                destination: '/Work',
              });
            }}
            onClick={(e) => {
              trackWorkProjectClick({
                project: featuredProject.displayTitle,
                slug: featuredProject.slug,
                location: 'home_featured_card',
                destination: '/Work',
              });
              if (isModifiedEvent(e)) return;
              e.preventDefault();
              onNavigate('/Work');
            }}
            className="group block rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-4 sm:focus-visible:outline-offset-8 focus-visible:outline-focus"
          >
            {/* Pure CSS hover/focus outline avoids JS pointermove tracking and HomeView re-renders */}
            <div
              data-cursor="project"
              className="relative aspect-[1604/902] w-full overflow-hidden rounded-[10px] bg-[#0B0C0C] shadow-[0_0_0_1px_var(--color-ink)] transition-shadow duration-200 ease-out hover:shadow-[0_0_0_6px_var(--color-ink)] sm:hover:shadow-[0_0_0_12px_var(--color-ink)] group-focus-visible:shadow-[0_0_0_6px_var(--color-ink)] sm:group-focus-visible:shadow-[0_0_0_12px_var(--color-ink)] motion-reduce:transition-none"
            >
              <img
                src={withBase('assets/wellbe-home-1604.webp')}
                alt="WELLBE+ mobile Quick Check-In interface beside the Wear OS circular emotion grid watch face"
                width={1604}
                height={902}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="block h-full w-full object-cover transform-gpu"
              />
            </div>

            {/* Minimal Centered Title & Description beneath frame */}
            <div className="mt-5 sm:mt-6 px-2.5 text-center sm:px-0">
              <h2 className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[0.6875rem] sm:text-[0.71875rem] font-bold uppercase tracking-[0.06em] text-ink transition-opacity duration-150 group-hover:opacity-70">
                <span>{featuredProject.displayTitle}</span>
                <span className="text-subtle font-normal" aria-hidden="true">
                  /
                </span>
                <span>{featuredProject.microLabel}</span>
              </h2>

              <p className="mx-auto mt-3 max-w-[600px] text-[0.9375rem] sm:text-[0.96875rem] font-normal leading-[1.6] text-muted">
                {featuredProject.heroTagline ?? featuredProject.summary}
              </p>
            </div>
          </a>
        </article>
      </div>

      {/* Centered 760px Editorial Column */}
      <div className="mx-auto max-w-[1100px] px-5 sm:px-10">
        <div className="mx-auto mt-16 max-w-[760px] sm:mt-20">
          {/* Small Divider 1: After Case Study, Before Editorial Intro */}
          <hr className="border-0 h-px w-full bg-hairline" />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={HERO_TRANSITION}
            className="pt-14 sm:pt-16"
          >
            <p className="editorial-lead">
              Hey, I&rsquo;m Micah—a UX researcher and designer in Atlanta, Georgia. I start with
              fieldwork and real-world observation, then use what I pick up to shape prototypes and
              user flows.
            </p>

            {/* Two-Column Metadata Strip aligned to 760px reading column */}
            <div className="mt-14 grid grid-cols-1 gap-8 sm:mt-16 sm:grid-cols-2 sm:gap-12">
              <div>
                <h2 className="micro-label text-muted">SKILLS &amp; SERVICES</h2>
                <p className="mt-3 text-[0.96875rem] sm:text-[1rem] font-medium leading-[1.55] text-ink">
                  Ethnographic Fieldwork, User Research, Market Research, Usability Testing, UX Design
                </p>
              </div>
              <div>
                <h2 className="micro-label text-muted">EDUCATION</h2>
                <p className="mt-3 text-[0.96875rem] sm:text-[1rem] font-medium leading-[1.55] text-ink">
                  UX/UI Design, Anthropology, Psychology
                </p>
              </div>
            </div>
          </motion.div>

          {/* Small Divider 2: Beneath Skills & Services / Education */}
          <hr className="my-14 sm:my-16 border-0 h-px w-full bg-hairline" />

          {/* About Section */}
          <motion.section
            aria-labelledby="about-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={SECTION_TRANSITION}
          >
            <h2 id="about-heading" className="micro-label scroll-mt-24 text-muted sm:scroll-mt-28">
              ABOUT
            </h2>
            <div className="mt-4 space-y-5 text-[0.96875rem] sm:text-[1rem] font-normal leading-[1.68] text-ink-body">
              <p>
                I&apos;m looking for full-time UX research or design roles in 2027. With
                Anthropology and Psychology degrees from Georgia State and a UX/UI certificate from
                Georgia Tech, I base design choices on how people actually act. I built that
                foundation through 100+ interviews, 200+ hours of usability testing at Sago and
                Schlesinger Group, and three ethnographic studies. Across my freelance work, Tech
                for Campaigns, and ten case studies, I put those findings straight into accessible,
                responsive builds.
              </p>
            </div>
          </motion.section>

          {/* Small Divider 3: Beneath Summary */}
          <hr className="my-14 sm:my-16 border-0 h-px w-full bg-hairline" />

          {/* Q&A Section */}
          <motion.section
            aria-labelledby="qa-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={SECTION_TRANSITION}
          >
            <h2 id="qa-heading" className="micro-label text-muted">
              Q&amp;A
            </h2>

            <div className="mt-8 divide-y divide-hairline/75">
              {QA_ITEMS.map((item) => {
                const paragraphs = Array.isArray(item.answer)
                  ? item.answer
                  : [item.answer];
                return (
                  <article key={item.question} className="py-7 first:pt-0 last:pb-0">
                    <h3 className="text-[1.0625rem] sm:text-[1.125rem] font-medium tracking-[-0.015em] text-ink">
                      {item.question}
                    </h3>
                    <div className="mt-3 space-y-3.5 text-[0.9375rem] sm:text-[0.96875rem] font-normal leading-[1.68] text-ink-body">
                      {paragraphs.map((paragraph, pIdx) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};
