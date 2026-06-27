'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { appointmentService } from '@/services/appointmentService';
import { doctorExtraService } from '@/services/doctorExtraService';
import type { DoctorExtraResponse, DoctorReviewResponse } from '@/types/api';
import { DoctorProfileModal } from '@/components/doctor/DoctorProfileModal';
import type { AugmentedDoctor } from '@/components/doctor/DoctorProfileModal';
import { DoctorEditModal } from '@/components/admin/DoctorEditModal';
import { DashboardHero } from '@/components/ui/DashboardHero';
import { useAuthStore } from '@/stores/authStore';

export default function OurDoctorsPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ar';
  const t = useTranslations('ourDoctors');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin';
  
  const [doctors, setDoctors] = useState<AugmentedDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<string>('');
  const [selectedGov, setSelectedGov] = useState<string>('');

  // Modals
  const [selectedDoctor, setSelectedDoctor] = useState<AugmentedDoctor | null>(null);
  const [editDoctor, setEditDoctor] = useState<AugmentedDoctor | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const docRes = await appointmentService.getDoctors();
      if (!docRes.succeeded || !docRes.data) {
        throw new Error(docRes.message || 'Failed to fetch doctors');
      }

      const baseDocs = docRes.data;
      
      const augPromises = baseDocs.map(async (doc) => {
        let extra: DoctorExtraResponse | null = null;
        let reviews: DoctorReviewResponse[] = [];
        
        try {
          const [extraRes, revRes] = await Promise.all([
            doctorExtraService.getExtra(doc.id),
            doctorExtraService.getReviews(doc.id)
          ]);
          if (extraRes.succeeded && extraRes.data) extra = extraRes.data;
          if (revRes.succeeded && revRes.data) reviews = revRes.data;
        } catch (e) {
          console.warn(`Failed to fetch extra for doctor ${doc.id}`, e);
        }

        let averageRating = null;
        if (reviews.length > 0) {
          averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
        }

        return {
          ...doc,
          extra,
          reviews,
          averageRating,
          totalReviews: reviews.length
        } as AugmentedDoctor;
      });

      const augmentedDocs = await Promise.all(augPromises);
      setDoctors(augmentedDocs);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Compute filter options
  const specializations = useMemo(() => {
    const specs = new Set<string>();
    doctors.forEach(d => { if (d.specialization) specs.add(d.specialization); });
    return Array.from(specs).sort();
  }, [doctors]);

  const governorates = useMemo(() => {
    const govs = new Set<string>();
    doctors.forEach(d => { if (d.extra?.governorate) govs.add(d.extra.governorate); });
    return Array.from(govs).sort();
  }, [doctors]);

  // Derived state for Rating Display Rules
  // Rule 1: If filtering by ONE specialization: only show rating if that specialization has 10+ doctors total in the system
  // Rule 2: If filtering by "All Specializations": show rating if there are 20+ total doctors in the system AND the doctor has at least 5 reviews.
  const totalDoctors = doctors.length;
  
  const canShowRating = (doc: AugmentedDoctor, currentSpecFilter: string) => {
    if (!doc.averageRating) return false;
    
    if (currentSpecFilter) {
      // Rule 1
      const docsInSpec = doctors.filter(d => d.specialization === currentSpecFilter).length;
      return docsInSpec >= 10;
    } else {
      // Rule 2
      return totalDoctors >= 20 && doc.totalReviews >= 5;
    }
  };

  // Apply filters
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchSearch = doc.fullName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSpec = selectedSpec ? doc.specialization === selectedSpec : true;
      const matchGov = selectedGov ? doc.extra?.governorate === selectedGov : true;
      return matchSearch && matchSpec && matchGov;
    });
  }, [doctors, searchQuery, selectedSpec, selectedGov]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <DashboardHero
        icon="groups"
        title={t('title')}
        subtitle={t('subtitle')}
      />

      {/* Filters */}
      <section className="bg-surface-container-lowest p-4 rounded-xl ambient-shadow ghost-border flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 start-3 text-on-surface-variant text-sm">search</span>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border border-surface-container-high rounded-full py-2.5 ps-9 pe-4 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        
        <div className="w-full sm:w-auto flex gap-3">
          <select
            value={selectedSpec}
            onChange={(e) => setSelectedSpec(e.target.value)}
            className="bg-surface-container-low border border-surface-container-high rounded-full py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">{t('allSpec')}</option>
            {specializations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <select
            value={selectedGov}
            onChange={(e) => setSelectedGov(e.target.value)}
            className="bg-surface-container-low border border-surface-container-high rounded-full py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">{t('allGov')}</option>
            {governorates.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="bg-error-container text-error rounded-xl p-4 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-surface-container-low rounded-xl h-64 animate-pulse"></div>
          ))}
        </div>
      ) : (
        /* Results */
        <>
          {filteredDoctors.length === 0 && !error ? (
            <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">person_off</span>
              <p className="text-on-surface-variant">{t('noDoctors')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDoctors.map(doc => {
                const showRating = canShowRating(doc, selectedSpec);
                
                return (
                  <div key={doc.id} className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow ghost-border flex flex-col group hover:-translate-y-1 transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 overflow-hidden border border-primary/20">
                        {doc.extra?.photoBase64 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={doc.extra.photoBase64} alt={doc.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold">{doc.fullName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface text-base line-clamp-1 group-hover:text-primary transition-colors">Dr. {doc.fullName}</h3>
                        <p className="text-xs text-on-surface-variant font-medium mt-0.5 bg-surface-container-high inline-block px-2 py-0.5 rounded-full">{doc.specialization || 'General'}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-5 flex-1">
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-tertiary">location_on</span>
                        <span className="truncate">{doc.extra?.governorate || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-secondary">workspace_premium</span>
                        <span>{t('yearsExp', { count: doc.yearsOfExperience })}</span>
                      </div>
                      
                      {/* Rating (conditionally shown based on rules) */}
                      {showRating ? (
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-[16px] text-yellow-500 fill-current">star</span>
                          <span className="font-bold text-on-surface">{doc.averageRating?.toFixed(1)}</span>
                          <span className="text-xs opacity-80">({t('reviews', { count: doc.totalReviews })})</span>
                        </div>
                      ) : (
                        <div className="h-5" /> // placeholder to keep card height consistent
                      )}
                    </div>

                    <button 
                      onClick={() => setSelectedDoctor(doc)}
                      className="w-full py-2 rounded-full border border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-colors"
                    >
                      {t('bookAppt')}
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => setEditDoctor(doc)}
                        className="w-full mt-2 py-2 rounded-full border border-secondary text-secondary font-semibold text-sm hover:bg-secondary hover:text-white transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span> Edit Info
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Doctor Profile Modal */}
      {selectedDoctor && (
        <DoctorProfileModal 
          doctor={selectedDoctor} 
          onClose={() => setSelectedDoctor(null)}
          locale={locale}
        />
      )}

      {/* Admin Edit Modal */}
      {editDoctor && (
        <DoctorEditModal
          doctor={editDoctor}
          currentExtra={editDoctor.extra}
          onClose={() => setEditDoctor(null)}
          onUpdated={() => {
            setEditDoctor(null);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}
