'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { doctorExtraService } from '@/services/doctorExtraService';
import type { DoctorForAppointment, DoctorExtraResponse } from '@/types/api';

interface DoctorEditModalProps {
  doctor: DoctorForAppointment;
  currentExtra: DoctorExtraResponse | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function DoctorEditModal({ doctor, currentExtra, onClose, onUpdated }: DoctorEditModalProps) {
  // token lives at the top-level of the store, NOT inside user
  const { token } = useAuthStore();

  const [bio, setBio] = useState(currentExtra?.bio || '');
  const [clinicAddress, setClinicAddress] = useState(currentExtra?.clinicAddress || '');
  const [consultationFee, setConsultationFee] = useState(
    currentExtra?.consultationFee != null ? String(currentExtra.consultationFee) : ''
  );
  const [governorate, setGovernorate] = useState(currentExtra?.governorate || '');
  const [photoBase64, setPhotoBase64] = useState(currentExtra?.photoBase64 || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        doctorId: doctor.id,
        bio,
        clinicAddress,
        consultationFee: consultationFee ? parseFloat(consultationFee) : undefined,
        governorate,
        photoBase64
      };

      const res = await doctorExtraService.updateExtra(payload);
      if (res.succeeded) {
        onUpdated();
      } else {
        setError(res.message || 'Failed to update doctor info');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
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
        className="bg-surface-container-lowest rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto ambient-shadow p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-sm">close</span>
        </button>

        <h2 className="text-xl font-bold text-on-surface mb-1">Edit Doctor Info</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Dr. {doctor.fullName} ({doctor.specialization})
        </p>

        <div className="space-y-4">
          {/* Photo */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Profile Photo (Max 2 MB)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-container-high overflow-hidden flex items-center justify-center flex-shrink-0">
                {photoBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant">person</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Biography / About
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-container-high rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Governorate */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Governorate
              </label>
              <input
                type="text"
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Consultation Fee */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Consultation Fee
              </label>
              <input
                type="number"
                min={0}
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Clinic Address */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Clinic Address
            </label>
            <input
              type="text"
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-container-high rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <div className="pt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-outline-variant text-on-surface hover:bg-surface-container-low py-2.5 rounded-full font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-primary text-white py-2.5 rounded-full font-bold hover:shadow-ambient hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
