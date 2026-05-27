'use client';

import { useState } from 'react';
import { reviewService } from '@/services/reviewService';
import { useAuthStore } from '@/stores/authStore';

interface RateExperienceModalProps {
  onClose: () => void;
}

export function RateExperienceModal({ onClose }: RateExperienceModalProps) {
  // token lives at the root of the store, NOT inside user
  const { user, token } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (!token || !user) {
      setError('You must be logged in to rate.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        patientId: user.userId,
        firstName: '',   // backend will resolve from userId
        rating,
        comment,
      };
      const res = await reviewService.submitReview(payload);
      if (res.succeeded) {
        setSuccess(true);
      } else {
        setError(res.message || 'Failed to submit rating.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 ambient-shadow relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-sm">close</span>
        </button>

        <div className="text-center mb-6 pt-2">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">star_rate</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Rate Your Experience</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            How would you rate your overall experience with MediScan AI?
          </p>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">check</span>
            </div>
            <h3 className="font-bold text-on-surface mb-1">Thank You!</h3>
            <p className="text-sm text-on-surface-variant">Your feedback helps us improve.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full bg-surface-container hover:bg-surface-container-high py-2 rounded-full font-semibold transition-colors text-on-surface"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <span
                    className="material-symbols-outlined text-4xl transition-colors"
                    style={{
                      color: star <= (hoverRating || rating) ? '#f59e0b' : '#e2e8f0',
                      fontVariationSettings:
                        star <= (hoverRating || rating) ? '"FILL" 1' : '"FILL" 0',
                    }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Additional Feedback (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Tell us what you liked or how we can improve..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            {error && <p className="text-xs text-error text-center">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="w-full signature-gradient text-white py-3 rounded-full font-bold text-sm hover:opacity-90 hover:shadow-ambient transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-12"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
