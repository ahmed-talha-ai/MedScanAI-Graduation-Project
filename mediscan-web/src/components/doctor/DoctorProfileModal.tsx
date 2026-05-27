'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DoctorForAppointment, DoctorExtraResponse, DoctorReviewResponse } from '@/types/api';
import { appointmentService } from '@/services/appointmentService';
import { useAuthStore } from '@/stores/authStore';

// Re-exported so our-doctors/page.tsx can import it from one place
export interface AugmentedDoctor extends DoctorForAppointment {
  extra: DoctorExtraResponse | null;
  reviews: DoctorReviewResponse[];
  averageRating: number | null;
  totalReviews: number;
}

interface DoctorProfileModalProps {
  doctor: AugmentedDoctor;
  onClose: () => void;
  locale: string;
}

export function DoctorProfileModal({ doctor, onClose }: DoctorProfileModalProps) {
  const t = useTranslations('ourDoctors');
  const { user } = useAuthStore();

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleBook = async () => {
    if (!user?.userId) {
      setBookingError('Please log in as a patient to book.');
      return;
    }

    if (!doctor.availableStartTimes || doctor.availableStartTimes.length === 0) {
      setBookingError('No available slots for this doctor.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const slot = doctor.availableStartTimes[0];
      // BookAppointmentPayload: patientId, patientName, doctorId, date, reason, status
      const res = await appointmentService.bookAppointment({
        patientId: user.userId,
        patientName: '',       // backend resolves from patientId
        doctorId: doctor.id,
        date: slot,            // correct field name is `date`, not `appointmentDate`
        reason: 'General Consultation',
        status: 'Confirmed',
      });

      if (res.succeeded) {
        setBookingSuccess(true);
      } else {
        setBookingError(res.message || 'Failed to book appointment');
      }
    } catch (err: any) {
      setBookingError(err.message || 'An error occurred while booking');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ambient-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Photo Section */}
        <div className="relative h-32 bg-primary/10 rounded-t-2xl flex justify-center">
          <button
            onClick={onClose}
            className="absolute top-4 end-4 w-8 h-8 bg-surface-container-lowest/50 hover:bg-surface-container-lowest rounded-full flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface text-sm">close</span>
          </button>

          <div className="absolute -bottom-12 w-24 h-24 rounded-full bg-surface-container-lowest p-1 shadow-md">
            <div className="w-full h-full rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden">
              {doctor.extra?.photoBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doctor.extra.photoBase64}
                  alt={doctor.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold">
                  {doctor.fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info Content */}
        <div className="pt-16 px-6 pb-6 text-center">
          <h2 className="text-xl font-bold text-on-surface">Dr. {doctor.fullName}</h2>
          <p className="text-sm font-semibold text-primary mt-1">
            {doctor.specialization || 'General'}
          </p>

          <div className="mt-6 text-start space-y-6">
            {/* Bio */}
            {doctor.extra?.bio && (
              <div>
                <h3 className="text-sm font-bold text-on-surface mb-2 border-b border-surface-container-high pb-1">
                  About
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{doctor.extra.bio}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-3 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined">workspace_premium</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Experience</p>
                  <p className="text-sm font-bold text-on-surface">
                    {doctor.yearsOfExperience} Years
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-low p-3 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Consultation Fee</p>
                  <p className="text-sm font-bold text-on-surface">
                    {doctor.extra?.consultationFee
                      ? `${doctor.extra.consultationFee} EGP`
                      : 'Contact Clinic'}
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-low p-3 rounded-lg flex items-center gap-3 sm:col-span-2">
                <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Clinic Address</p>
                  <p className="text-sm font-bold text-on-surface">
                    {doctor.extra?.clinicAddress || 'Not specified'}
                    {doctor.extra?.governorate ? ` — ${doctor.extra.governorate}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Reviews Preview (Top 3) */}
            {doctor.reviews.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-on-surface mb-3 border-b border-surface-container-high pb-1">
                  Patient Reviews ({doctor.averageRating?.toFixed(1)} / 5)
                </h3>
                <div className="space-y-3">
                  {doctor.reviews.slice(0, 3).map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-surface-container-lowest border border-surface-container-high rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-on-surface">
                          Anonymous Patient
                        </span>
                        <div className="flex text-yellow-500 text-[10px]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className="material-symbols-outlined"
                              style={{
                                fontVariationSettings: i < rev.rating ? '"FILL" 1' : '"FILL" 0',
                              }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {rev.comment || 'No comment provided.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Actions */}
            <div className="pt-4 mt-6 border-t border-surface-container-high">
              {bookingSuccess ? (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined">check_circle</span>
                  <p className="text-sm font-semibold">Appointment booked successfully!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {bookingError && (
                    <p className="text-xs text-error text-center">{bookingError}</p>
                  )}
                  <button
                    onClick={handleBook}
                    disabled={bookingLoading}
                    className="w-full bg-primary text-white py-3 rounded-full font-bold text-sm hover:shadow-ambient hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                        {t('bookAppt')}
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-on-surface-variant">
                    By booking, you agree to the clinic&apos;s cancellation policy. The first
                    available slot will be reserved.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
