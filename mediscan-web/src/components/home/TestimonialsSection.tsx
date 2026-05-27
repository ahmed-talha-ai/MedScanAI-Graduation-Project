'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { reviewService } from '@/services/reviewService';
import type { WebsiteReviewResponse } from '@/types/api';
import { ANIM_CLASSES, staggerDelay, useInView } from '@/lib/animations';

export function TestimonialsSection() {
  const t = useTranslations('landing');
  const [reviews, setReviews] = useState<WebsiteReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // useInView signature: (threshold?: number, triggerOnce?: boolean) => [ref, isInView]
  const [ref, inView] = useInView<HTMLElement>(0.1, true);

  useEffect(() => {
    let cancelled = false;
    const fetchReviews = async () => {
      try {
        const res = await reviewService.getAllReviews();
        if (!cancelled && res.succeeded && res.data) {
          const goodReviews = res.data
            .filter(r => r.rating >= 4)
            .slice(0, 6);
          setReviews(goodReviews);
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

  if (loading || reviews.length === 0) return null;

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="testimonials" className="py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className={`text-4xl font-bold text-on-surface mb-4 transition-all duration-1000 ease-out ${inView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
            style={{ transitionDelay: staggerDelay(0, 150) }}
          >
            {t('testimonialsTitle')}
          </h2>
          <p
            className={`text-on-surface-variant text-lg max-w-2xl mx-auto transition-all duration-1000 ease-out ${inView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
            style={{ transitionDelay: staggerDelay(1, 150) }}
          >
            {t('testimonialsSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((rev, idx) => (
            <div
              key={rev.id}
              className={`bg-surface-container-lowest border border-surface-container-high rounded-2xl p-6 ambient-shadow flex flex-col justify-between transition-all duration-1000 ease-out ${inView ? ANIM_CLASSES.fadeUpIn : ANIM_CLASSES.fadeUp}`}
              style={{ transitionDelay: staggerDelay(idx, 100) }}
            >
              <div>
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
                  &ldquo;{rev.comment || 'Excellent service and great AI tools.'}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {rev.firstName ? rev.firstName.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{rev.firstName || 'Patient'}</p>
                  <p className="text-xs text-on-surface-variant">Verified User</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
