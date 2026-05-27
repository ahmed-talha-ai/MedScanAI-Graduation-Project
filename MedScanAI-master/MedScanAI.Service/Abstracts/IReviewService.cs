using MedScanAI.Domain.Entities;

namespace MedScanAI.Service.Abstracts
{
    public interface IReviewService
    {
        Task<bool> SubmitAsync(WebsiteReview review);
        Task<List<WebsiteReview>> GetAllAsync();
    }
}
