using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Service.Abstracts;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Service.Implementation
{
    public class DoctorExtraService : IDoctorExtraService
    {
        private readonly AppDbContext _context;

        public DoctorExtraService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DoctorExtra?> GetExtraAsync(string doctorId)
        {
            return await _context.DoctorExtras
                .FirstOrDefaultAsync(e => e.DoctorId == doctorId);
        }

        public async Task<List<DoctorReview>> GetReviewsAsync(string doctorId)
        {
            return await _context.DoctorReviews
                .Include(r => r.Patient)
                .Where(r => r.DoctorId == doctorId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> SubmitReviewAsync(DoctorReview review)
        {
            var existingReview = await _context.DoctorReviews
                .FirstOrDefaultAsync(r => r.DoctorId == review.DoctorId && r.PatientId == review.PatientId);

            if (existingReview != null)
            {
                existingReview.Rating = review.Rating;
                existingReview.Comment = review.Comment;
                existingReview.UpdatedAt = DateTime.UtcNow;
                _context.DoctorReviews.Update(existingReview);
            }
            else
            {
                await _context.DoctorReviews.AddAsync(review);
            }

            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> UpdateExtraAsync(DoctorExtra extra)
        {
            var existingExtra = await _context.DoctorExtras
                .FirstOrDefaultAsync(e => e.DoctorId == extra.DoctorId);

            if (existingExtra != null)
            {
                existingExtra.Bio = extra.Bio;
                existingExtra.ClinicAddress = extra.ClinicAddress;
                existingExtra.ConsultationFee = extra.ConsultationFee;
                existingExtra.Governorate = extra.Governorate;
                if (!string.IsNullOrEmpty(extra.PhotoBase64))
                {
                    existingExtra.PhotoBase64 = extra.PhotoBase64;
                }
                existingExtra.UpdatedAt = DateTime.UtcNow;
                _context.DoctorExtras.Update(existingExtra);
            }
            else
            {
                await _context.DoctorExtras.AddAsync(extra);
            }

            return await _context.SaveChangesAsync() > 0;
        }
    }
}
