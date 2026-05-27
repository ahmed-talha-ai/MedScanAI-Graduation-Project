using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Service.Abstracts;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Service.Implementation
{
    public class ReviewService : IReviewService
    {
        private readonly AppDbContext _context;

        public ReviewService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<WebsiteReview>> GetAllAsync()
        {
            return await _context.WebsiteReviews
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> SubmitAsync(WebsiteReview review)
        {
            var existingReview = await _context.WebsiteReviews
                .FirstOrDefaultAsync(r => r.PatientId == review.PatientId);

            if (existingReview != null)
            {
                existingReview.Rating = review.Rating;
                existingReview.Comment = review.Comment;
                existingReview.FirstName = review.FirstName;
                existingReview.UpdatedAt = DateTime.UtcNow;
                _context.WebsiteReviews.Update(existingReview);
            }
            else
            {
                await _context.WebsiteReviews.AddAsync(review);
            }

            return await _context.SaveChangesAsync() > 0;
        }
    }
}
