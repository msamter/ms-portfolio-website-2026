import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { CASE_STUDIES, CaseStudy } from '../data/projects';
import { ReadingProgressBar } from '../components/ReadingProgressBar';
import { PhoneScrollTrack } from '../components/PhoneScrollTrack';
import { LivePrototypeDemos } from '../components/LivePrototypeDemos';
import { isModifiedEvent, withBase } from '../utils/paths';
import { usePortfolioAnalytics } from '../hooks/usePortfolioAnalytics';

interface CaseStudyViewProps {
  project: CaseStudy;
  onNavigate: (path: string) => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const HERO_TRANSITION = { duration: 0.42, ease: EASE } as const;
const HERO_PUSHUP_TRANSITION = {
  duration: 1.25,
  ease: [0.16, 1, 0.3, 1] as const,
} as const;
const SECTION_TRANSITION = { duration: 0.38, ease: EASE } as const;
const SECTION_VIEWPORT = { once: true, amount: 'some' as const } as const;

const HeroSmartphoneShowcase: React.FC<{
  projectTitle: string;
  heroImages?: CaseStudy['heroImages'];
}> = React.memo(({ projectTitle, heroImages }) => {
  const fullSrc = heroImages?.src ?? 'assets/wellbe-work-1604.webp';
  const fullWidth = heroImages?.width ?? 1604;
  const fullHeight = heroImages?.height ?? 902;
  const alt =
    heroImages?.alt ??
    `${projectTitle} mobile interface screens showcase`;

  return (
    <section
      aria-label={`${projectTitle} showcase`}
      className="relative z-0 flex w-full justify-center overflow-x-clip"
    >
      <motion.div
        initial={{ y: 88 }}
        animate={{ y: 0 }}
        transition={HERO_PUSHUP_TRANSITION}
        className="relative w-[min(99vw,166svh,1780px)] shrink-0 will-change-transform"
      >
        <img
          src={withBase(fullSrc)}
          alt={alt}
          width={fullWidth}
          height={fullHeight}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          style={{ aspectRatio: `${fullWidth} / ${fullHeight}` }}
          className="pointer-events-none block h-auto w-full select-none -mt-[5.61%] -mb-[2.25%] drop-shadow-[0_18px_36px_rgba(14,14,14,0.14)]"
        />
      </motion.div>
    </section>
  );
});

HeroSmartphoneShowcase.displayName = 'HeroSmartphoneShowcase';

const SectionVisualAsset: React.FC<{
  image: NonNullable<CaseStudy['sections'][number]['image']>;
}> = React.memo(({ image }) => {
  const computedAspectRatio =
    image.aspectRatio ??
    (image.width && image.height ? `${image.width} / ${image.height}` : undefined);

  return (
    <figure
      className={
        image.variant === 'phone'
          ? 'mt-12 mx-auto w-full max-w-[310px] sm:max-w-[340px]'
          : 'mt-10 w-full overflow-hidden rounded-[10px] bg-[#1B1C20]'
      }
      style={computedAspectRatio ? { aspectRatio: computedAspectRatio } : undefined}
    >
      <img
        src={withBase(image.src)}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading="lazy"
        decoding="async"
        className={
          image.variant === 'phone'
            ? 'block h-full w-full object-contain drop-shadow-[0_18px_36px_rgba(14,14,14,0.14)]'
            : 'block h-full w-full object-cover'
        }
        style={computedAspectRatio ? { aspectRatio: computedAspectRatio } : undefined}
      />
    </figure>
  );
});

SectionVisualAsset.displayName = 'SectionVisualAsset';

export const CaseStudyView: React.FC<CaseStudyViewProps> = ({
  project,
  onNavigate,
}) => {
  const { trackExternalLinkClick, trackWorkProjectClick } = usePortfolioAnalytics();
  const articleRef = useRef<HTMLElement | null>(null);
  const currentIndex = CASE_STUDIES.findIndex((p) => p.slug === project.slug);
  const nextProject =
    CASE_STUDIES.length > 1
      ? CASE_STUDIES[(currentIndex + 1) % CASE_STUDIES.length]
      : null;

  return (
    <article ref={articleRef} className="relative w-full">
      <ReadingProgressBar targetRef={articleRef} />
      {/* Case Study Hero Header — positions top bezel of the 4 smartphones so only the top half is visible above the fold */}
      <header
        className={
          project.heroImages?.src
            ? 'relative z-10 mx-auto flex min-h-[max(200px,calc(100svh_-_58px_-_min(99vw,166svh,1780px)_*_0.2257))] max-w-[1100px] flex-col justify-center px-5 py-6 text-center sm:px-10'
            : 'relative z-10 mx-auto flex min-h-[max(200px,calc(100svh_-_58px_-_min(108vw,180svh,1920px)_*_0.2156))] max-w-[1100px] flex-col justify-center px-5 py-6 text-center sm:px-10'
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={HERO_TRANSITION}
        >
          <h1 className="font-sans text-[clamp(2.75rem,8vw,5.75rem)] font-bold leading-[0.98] tracking-[-0.03em] text-ink">
            {project.displayTitle}
          </h1>

          {project.heroTagline && (
            <p className="mx-auto mt-4 max-w-[36ch] text-[1.125rem] font-normal leading-[1.36] tracking-[-0.015em] text-ink-body text-balance sm:mt-5 sm:text-[1.45rem]">
              {project.heroTagline}
            </p>
          )}

          <p className="mt-4 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted sm:mt-5 sm:text-[0.71875rem]">
            {project.microLabel}
          </p>
        </motion.div>
      </header>

      {/* Full-Width 4-Smartphone Hero Showcase (Case Study page only) */}
      <HeroSmartphoneShowcase
        projectTitle={project.title}
        heroImages={project.heroImages}
      />

      {/* Structured Editorial Narrative Column (760px) */}
      <div className="relative z-10 mx-auto max-w-[760px] px-5 pt-0 sm:px-8 sm:pt-20">
        {/* Four-Part Metadata Bar — full viewing window on mobile so Overview sits below the fold */}
        <div className="-mx-1.5 flex min-h-[calc(100svh_-_58px)] flex-col justify-center px-1.5 py-8 sm:mx-0 sm:block sm:min-h-0 sm:px-0 sm:py-0">
          <section
            aria-label="Project Metadata"
            className="grid grid-cols-1 gap-x-10 gap-y-8 border-y border-hairline py-10 sm:grid-cols-2 sm:gap-y-7 sm:py-8"
          >
            <div>
              <h2 className="micro-label text-muted">ROLE</h2>
              <p className="mt-2 text-[0.96875rem] font-medium leading-[1.5] text-ink">
                {project.metadata.role}
              </p>
            </div>
            <div>
              <h2 className="micro-label text-muted">TOOLS</h2>
              <p className="mt-2 text-[0.96875rem] font-medium leading-[1.5] text-ink">
                {project.metadata.tools}
              </p>
            </div>
            <div>
              <h2 className="micro-label text-muted">SCOPE</h2>
              <p className="mt-2 text-[0.96875rem] leading-[1.55] text-ink-body">
                {project.metadata.scope}
              </p>
            </div>
            <div>
              <h2 className="micro-label text-muted">METHODS</h2>
              <p className="mt-2 text-[0.96875rem] leading-[1.55] text-ink-body">
                {project.metadata.methods}
              </p>
            </div>
          </section>
        </div>

        {/* Narrative Sections */}
        <div className="mt-4 -mx-2.5 space-y-7 sm:mt-14 sm:-mx-4 sm:space-y-10">
          {project.sections.map((section, sectionIdx) => {
            const sectionNumber = String(sectionIdx + 1).padStart(2, '0');
            const sectionLabel = section.kicker.replace(/^\d+\.\s*/, '');

            const hasStickyTrack = Boolean(
              section.phoneCarousel && section.phoneCarousel.length > 0
            );
            const sectionClasses =
              'rounded-[10px] border border-hairline bg-surface px-4 py-6 sm:px-7 sm:py-8 md:px-9 md:py-9';
            const sectionContent = (
              <>
                {/* Editorial Section Index Bar: Enlarged Uppercase Numeral / Title */}
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-b border-hairline pb-3.5 sm:gap-x-3 sm:pb-4">
                  <span className="font-sans text-[1.45rem] sm:text-[1.85rem] font-black uppercase leading-[1.12] tracking-[0.01em] text-ink tabular-nums shrink-0">
                    {sectionNumber}
                  </span>
                  <span
                    className="text-[1.15rem] sm:text-[1.45rem] font-normal leading-none text-subtle select-none shrink-0"
                    aria-hidden="true"
                  >
                    /
                  </span>
                  {section.heading ? (
                    <p className="font-sans text-[1.45rem] sm:text-[1.85rem] font-black uppercase leading-[1.12] tracking-[0.01em] text-ink">
                      {sectionLabel}
                    </p>
                  ) : (
                    <h2
                      id={`${project.slug}-${section.id}`}
                      className="font-sans text-[1.45rem] sm:text-[1.85rem] font-black uppercase leading-[1.12] tracking-[0.01em] text-ink"
                    >
                      {sectionLabel}
                    </h2>
                  )}
                </div>

                {section.heading && (
                  <h2
                    id={`${project.slug}-${section.id}`}
                    className="mt-6 sm:mt-7 text-[1.5rem] sm:text-[1.95rem] font-medium tracking-[-0.02em] leading-[1.22] text-ink text-balance"
                  >
                    {section.heading}
                  </h2>
                )}

                {section.lead && (
                  <p className="mt-5 text-[1.2rem] sm:text-[1.32rem] font-normal leading-[1.48] tracking-[-0.01em] text-ink">
                    {section.lead}
                  </p>
                )}

                <div
                  className={`${
                    section.heading || section.lead ? 'mt-6' : 'mt-4'
                  } space-y-5 text-[1rem] sm:text-[1.0625rem] leading-[1.68] text-ink-body`}
                >
                  {section.paragraphs.map((paragraph, pIdx) => (
                    <p key={pIdx}>{paragraph}</p>
                  ))}
                </div>

                {/* Research Objectives & Problem / Solution inside Overview */}
                {section.id === 'overview' &&
                  project.researchGoals &&
                  project.researchGoals.length > 0 && (
                    <div className="mt-9 border-t border-hairline pt-8">
                      <h3 className="micro-label text-muted">
                        RESEARCH OBJECTIVES
                      </h3>
                      <ol className="mt-5 space-y-3.5">
                        {project.researchGoals.map((goal, idx) => (
                          <li key={goal} className="flex items-baseline gap-4">
                            <span className="text-[0.75rem] font-semibold text-muted tabular-nums shrink-0">
                              0{idx + 1}
                            </span>
                            <p className="text-[0.96875rem] leading-[1.58] text-ink-body">
                              {goal}
                            </p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                {section.id === 'overview' && project.problemSolution && (
                  <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-7 border-t border-hairline pt-8 sm:grid-cols-2">
                    <div>
                      <h3 className="micro-label text-muted">PROBLEM</h3>
                      <p className="mt-2 text-[0.96875rem] leading-[1.58] text-ink-body">
                        {project.problemSolution.problem}
                      </p>
                    </div>
                    <div>
                      <h3 className="micro-label text-muted">SOLUTION</h3>
                      <p className="mt-2 text-[0.96875rem] leading-[1.58] text-ink-body">
                        {project.problemSolution.solution}
                      </p>
                    </div>
                  </div>
                )}

                {/* Grounded Research Scope Metrics Strip inside Roles & Responsibilities */}
                {section.id === 'roles-and-responsibilities' &&
                  project.metrics.length > 0 && (
                    <div
                      aria-label="Research Scope Overview"
                      className="mt-10 grid grid-cols-1 gap-8 border-t border-hairline pt-9 sm:grid-cols-3"
                    >
                      {project.metrics.map((metric) => (
                        <div key={metric.label}>
                          <p className="text-[2.2rem] font-medium tracking-[-0.03em] text-ink tabular-nums leading-none">
                            {metric.value}
                          </p>
                          <p className="mt-2.5 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-ink">
                            {metric.label}
                          </p>
                          <p className="mt-1.5 text-[0.84375rem] leading-[1.5] text-muted">
                            {metric.context}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Clean Hairline Interview Callout (No thick left accent stripe) */}
                {section.callout && (
                  <figure className="mt-10 border-t border-hairline pt-7">
                    <p className="micro-label text-muted">{section.callout.label}</p>
                    <blockquote className="mt-3 text-[1.22rem] sm:text-[1.35rem] font-normal leading-[1.45] tracking-[-0.01em] text-ink">
                      &ldquo;{section.callout.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-3.5 text-[0.8125rem] text-muted">
                      {section.callout.attribution}
                    </figcaption>
                  </figure>
                )}

                {/* Competitive Audit Matrix — stacked editorial rows on mobile, 3-col table on sm+ */}
                {section.auditTable && (
                  <div className="my-10 border-t border-hairline">
                    {/* Mobile stacked view (<640px) — zero horizontal overflow */}
                    <div className="divide-y divide-hairline sm:hidden">
                      {section.auditTable.map((row) => (
                        <div key={row.category} className="py-4 space-y-1.5">
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-[0.9375rem] font-medium text-ink">
                              {row.category}
                            </p>
                            <span className="text-[0.78125rem] text-muted whitespace-nowrap tabular-nums shrink-0">
                              {row.platformsAudited}
                            </span>
                          </div>
                          <p className="text-[0.90625rem] leading-[1.55] text-ink-body">
                            {row.dominantGap}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Desktop/Tablet 3-column table (sm+) */}
                    <table className="hidden w-full border-collapse text-left sm:table">
                      <thead>
                        <tr className="border-b border-hairline">
                          <th className="py-3.5 pr-4 micro-label text-muted">Category</th>
                          <th className="py-3.5 px-4 micro-label text-muted">Audited</th>
                          <th className="py-3.5 pl-4 micro-label text-muted">Dominant Gap Identified</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline text-[0.90625rem]">
                        {section.auditTable.map((row) => (
                          <tr key={row.category}>
                            <td className="py-4 pr-4 font-medium text-ink align-top">
                              {row.category}
                            </td>
                            <td className="py-4 px-4 text-muted whitespace-nowrap tabular-nums align-top">
                              {row.platformsAudited}
                            </td>
                            <td className="py-4 pl-4 text-ink-body leading-[1.55] align-top">
                              {row.dominantGap}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Scope & Constraints Decision Table — stacked editorial rows on mobile, 3-col table on sm+ */}
                {section.scopeTable && (
                  <div className="mt-10 border-t border-hairline">
                    {/* Mobile stacked view (<640px) — zero horizontal overflow */}
                    <div className="divide-y divide-hairline sm:hidden">
                      {section.scopeTable.map((row) => (
                        <div key={row.status} className="py-4 space-y-1.5">
                          <p className="micro-label font-semibold text-muted">
                            {row.status}
                          </p>
                          <p className="text-[0.9375rem] font-medium leading-[1.45] text-ink">
                            {row.decision}
                          </p>
                          <p className="text-[0.90625rem] leading-[1.55] text-ink-body">
                            {row.driver}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Desktop/Tablet 3-column table (sm+) */}
                    <table className="hidden w-full border-collapse text-left sm:table">
                      <thead>
                        <tr className="border-b border-hairline">
                          <th className="py-3.5 pr-4 micro-label text-muted">Status</th>
                          <th className="py-3.5 px-4 micro-label text-muted">Decision</th>
                          <th className="py-3.5 pl-4 micro-label text-muted">
                            What Drove It
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline text-[0.90625rem]">
                        {section.scopeTable.map((row) => (
                          <tr key={row.status}>
                            <td className="py-4 pr-4 micro-label font-semibold text-ink whitespace-nowrap align-top">
                              {row.status}
                            </td>
                            <td className="py-4 px-4 font-medium text-ink leading-[1.5] align-top">
                              {row.decision}
                            </td>
                            <td className="py-4 pl-4 text-ink-body leading-[1.55] align-top">
                              {row.driver}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Working Prototype Callout & Link */}
                {section.prototypeCta && (
                  <div className="mt-10 flex flex-col gap-4 border-y border-hairline py-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      {section.prototypeCta.kicker && (
                        <p className="micro-label text-muted">
                          {section.prototypeCta.kicker}
                        </p>
                      )}
                      <p className="mt-1.5 text-[1.0625rem] font-medium leading-[1.4] text-ink">
                        {section.prototypeCta.tagline}
                      </p>
                    </div>
                    <a
                      href={section.prototypeCta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackExternalLinkClick({
                          label: section.prototypeCta!.buttonLabel,
                          url: section.prototypeCta!.href,
                          location: 'case_study_cta',
                          category: 'prototype',
                          interaction: 'open',
                        })
                      }
                      onAuxClick={(e) => {
                        if (e.button !== 1) return;
                        trackExternalLinkClick({
                          label: section.prototypeCta!.buttonLabel,
                          url: section.prototypeCta!.href,
                          location: 'case_study_cta',
                          category: 'prototype',
                          interaction: 'open',
                        });
                      }}
                      className="group inline-flex min-h-[44px] w-full sm:w-fit shrink-0 items-center justify-center gap-2 bg-accent-bg px-5 py-2.5 text-[0.71875rem] font-semibold uppercase tracking-[0.08em] text-accent-fg transition-colors duration-150 hover:bg-accent-bg-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
                    >
                      <span>{section.prototypeCta.buttonLabel}</span>
                      <ArrowUpRight
                        size={14}
                        strokeWidth={1.75}
                        className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </a>
                  </div>
                )}

                {/* Interactive Live Smartphone & Round Pixel Watch Prototypes */}
                {section.livePrototypes && (
                  <LivePrototypeDemos config={section.livePrototypes} />
                )}

                {/* Section Visual Asset */}
                {section.image && <SectionVisualAsset image={section.image} />}

                {/* Key Synthesis Findings — stacked editorial rows on mobile, 2-col table on sm+ */}
                {section.findings && (
                  <div className="mt-10 border-t border-hairline">
                    {/* Mobile stacked view (<640px) — avoids mismatched floating 2-col header */}
                    <div className="divide-y divide-hairline sm:hidden">
                      {section.findings.map((finding, fIdx) => (
                        <div key={finding.title} className="py-5 space-y-2.5">
                          <div>
                            <p className="micro-label text-muted tabular-nums">
                              LESSON 0{fIdx + 1}
                            </p>
                            <p className="mt-1 text-[0.96875rem] font-medium leading-[1.4] text-ink">
                              {finding.title}
                            </p>
                          </div>
                          <div>
                            <p className="micro-label text-muted">STORY</p>
                            <p className="mt-1 text-[0.90625rem] leading-[1.6] text-ink-body">
                              {finding.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop/Tablet 2-column table (sm+) */}
                    <table className="hidden w-full border-collapse text-left sm:table">
                      <thead>
                        <tr className="border-b border-hairline">
                          <th className="w-[42%] py-3.5 pr-6 micro-label text-muted">
                            LESSONS
                          </th>
                          <th className="w-[58%] py-3.5 pl-6 micro-label text-muted">
                            STORIES
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {section.findings.map((finding, fIdx) => (
                          <tr key={finding.title}>
                            <td className="py-5 pr-6 align-top">
                              <div className="flex items-baseline gap-2.5">
                                <span className="text-[0.75rem] font-medium text-muted tabular-nums shrink-0">
                                  0{fIdx + 1}.
                                </span>
                                <span className="text-[0.96875rem] font-medium leading-[1.45] text-ink">
                                  {finding.title}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 pl-6 text-[0.9375rem] leading-[1.6] text-ink-body align-top">
                              {finding.detail}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Horizontal Scroll Track of 6 Uniform Smartphone Frames */}
                {section.phoneCarousel && section.phoneCarousel.length > 0 && (
                  <div className="mt-10 border-t border-hairline pt-8 sm:mt-12 sm:pt-10">
                    <h3 className="micro-label mb-3 text-muted">
                      MOBILE MOCKUPS
                    </h3>
                    <PhoneScrollTrack
                      slides={section.phoneCarousel}
                      frameAspect="450/974"
                      ariaLabel={`${project.displayTitle} mobile mockups`}
                    />
                  </div>
                )}
              </>
            );

            return (
              <React.Fragment key={section.id}>
                {sectionIdx > 0 && (
                  <hr className="border-0 h-px w-full bg-hairline" />
                )}
                {hasStickyTrack ? (
                  <section
                    aria-labelledby={`${project.slug}-${section.id}`}
                    className={sectionClasses}
                  >
                    {sectionContent}
                  </section>
                ) : (
                  <motion.section
                    aria-labelledby={`${project.slug}-${section.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={SECTION_VIEWPORT}
                    transition={SECTION_TRANSITION}
                    className={sectionClasses}
                  >
                    {sectionContent}
                  </motion.section>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Colophon Stamp */}
        <div className="mt-16 sm:mt-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-hairline pt-8">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={withBase('assets/m-grey.webp')}
              alt="Micah Samter monogram"
              width={24}
              height={24}
              loading="lazy"
              decoding="async"
              className="aspect-square h-6 w-6 shrink-0 object-contain"
            />
            <span className="text-[0.78125rem] text-muted">
              End of Case Study · {project.displayTitle}
            </span>
          </div>
          <span className="micro-label text-muted tabular-nums shrink-0">
            {project.year}
          </span>
        </div>

        {/* Next Project Navigation Bar (only when multiple projects exist) */}
        {nextProject && (
          <nav
            aria-label="Next Case Study"
            className="mt-14 border-t border-ink pt-8"
          >
            <a
              href={withBase(
                nextProject.slug === CASE_STUDIES[0]?.slug
                  ? '/Work'
                  : `/work/${nextProject.slug}`
              )}
              onAuxClick={(e) => {
                if (e.button !== 1) return;
                const destination =
                  nextProject.slug === CASE_STUDIES[0]?.slug
                    ? '/Work'
                    : `/work/${nextProject.slug}`;
                trackWorkProjectClick({
                  project: nextProject.displayTitle,
                  slug: nextProject.slug,
                  location: 'next_project_card',
                  destination,
                });
              }}
              onClick={(e) => {
                const destination =
                  nextProject.slug === CASE_STUDIES[0]?.slug
                    ? '/Work'
                    : `/work/${nextProject.slug}`;
                trackWorkProjectClick({
                  project: nextProject.displayTitle,
                  slug: nextProject.slug,
                  location: 'next_project_card',
                  destination,
                });
                if (isModifiedEvent(e)) return;
                e.preventDefault();
                onNavigate(destination);
              }}
              className="group flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-focus"
            >
              <div>
                <p className="micro-label text-muted">NEXT PROJECT</p>
                <p className="mt-2 text-[1.65rem] sm:text-[2.1rem] font-medium tracking-[-0.02em] text-ink leading-[1.15] transition-opacity duration-150 group-hover:opacity-70">
                  {nextProject.title}
                </p>
                <p className="mt-1.5 text-[0.9375rem] text-muted">{nextProject.subtitle}</p>
              </div>
              <span className="inline-flex items-center gap-2 text-[0.71875rem] font-semibold uppercase tracking-[0.08em] text-ink shrink-0">
                <span className="editorial-underline">View Case Study</span>
                <ArrowRight
                  size={15}
                  strokeWidth={1.75}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </a>
          </nav>
        )}
      </div>
    </article>
  );
};
