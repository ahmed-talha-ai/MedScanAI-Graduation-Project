'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { reviewService } from '@/services/reviewService';
import type { WebsiteReviewResponse } from '@/types/api';
import { ANIM_CLASSES, staggerDelay, useInView } from '@/lib/animations';
import { TypewriterText } from '@/components/ui/TypewriterText';

interface DisplayReview {
  id: string | number;
  firstName: string;
  comment: string;
  rating: number;
}

const FALLBACK_REVIEWS: DisplayReview[] = [
  { id: 'fb-1', firstName: '', comment: '', rating: 5 },
  { id: 'fb-2', firstName: '', comment: '', rating: 5 },
  { id: 'fb-3', firstName: '', comment: '', rating: 4 },
  { id: 'fb-4', firstName: '', comment: '', rating: 5 },
  { id: 'fb-5', firstName: '', comment: '', rating: 5 },
  { id: 'fb-6', firstName: '', comment: '', rating: 4 },
];

export function TestimonialsSection() {
  const t = useTranslations('landing');
  const [reviews, setReviews] = useState<DisplayReview[]>([]);
  const [loading, setLoading] = useState(true);

  const [ref, inView] = useInView<HTMLElement>(0.1, true);

  useEffect(() => {
    let cancelled = false;
    const fetchReviews = async () => {
      try {
        const res = await reviewService.getAllReviews();
        if (!cancelled && res.succeeded && res.data && res.data.length > 0) {
          const goodReviews = res.data
            .filter(r => r.rating >= 4)
            .slice(0, 6)
            .map(r => ({
              id: r.id,
              firstName: r.firstName,
              comment: r.comment || '',
              rating: r.rating,
            }));
          if (goodReviews.length > 0) {
            setReviews(goodReviews);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch testimonials', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchReviews();
    return () => { cancelled = true; };
  }, []);

  // Use API reviews + pad with fallback to always show 6
  const fallbackWithText = FALLBACK_REVIEWS.map((fb, i) => ({
    ...fb,
    firstName: t(`fallbackReviews.r${i + 1}.name` as 'testimonialsTitle'),
    comment: t(`fallbackReviews.r${i + 1}.comment` as 'testimonialsTitle'),
  }));

  const displayReviews = reviews.length >= 6
    ? reviews.slice(0, 6)
    : [...reviews, ...fallbackWithText.slice(reviews.length)].slice(0, 6);

  const AVATAR_COLORS = [
    'bg-primary/10 text-primary',
    'bg-purple-100 text-purple-600',
    'bg-pink-100 text-pink-600',
    'bg-sky-100 text-sky-600',
    'bg-amber-100 text-amber-600',
    'bg-emerald-100 text-emerald-600',
  ];

  return (
    <section ref={ref} id="testimonials" className="py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <span className="material-symbols-outlined text-sm">reviews</span>
            {t('testimonialsTitle')}
          </div>
          <h2 className="text-4xl font-bold text-on-surface mb-4">
            <TypewriterText text={t('testimonialsTitle')} speed={50} delay={200} />
          </h2>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
            {t('testimonialsSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayReviews.map((rev, idx) => (
            <div 
              key={rev.id}
              className={`transition-all duration-1000 ease-out ${inView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
              style={{ transitionDelay: staggerDelay(idx, 150) }}
            >
              <div className="h-full animate-float-slow hover:animate-none" style={{ animationDelay: `${idx * 0.3}s` }}>
                <div className="group h-full relative overflow-hidden bg-surface-container-lowest border border-surface-container-high rounded-3xl p-8 hover:shadow-xl transition-all duration-500 ease-out flex flex-col justify-between hover:-translate-y-2 hover:scale-[1.02]">
                  {/* Colorful gradient blobs on hover */}
                  <div className="absolute -top-16 -end-16 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 pointer-events-none bg-primary" />
                  <div className="absolute -bottom-16 -start-16 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 pointer-events-none bg-secondary" />
                  
                  <div className="relative z-10">
                    <div className="flex gap-1 mb-4 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className="material-symbols-outlined text-sm"
                          style={{ fontVariationSettings: i < rev.rating ? '"FILL" 1' : '"FILL" 0' }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <p className="text-on-surface-variant text-sm italic mb-6 leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`w-10 h-10 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-sm`}>
                      {rev.firstName ? rev.firstName.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{rev.firstName || 'Patient'}</p>
                      <p className="text-xs text-on-surface-variant">{t('verifiedUser' as 'testimonialsTitle')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
