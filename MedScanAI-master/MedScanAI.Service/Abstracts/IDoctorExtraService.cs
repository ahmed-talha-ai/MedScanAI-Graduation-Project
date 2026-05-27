using MedScanAI.Domain.Entities;

namespace MedScanAI.Service.Abstracts
{
    public interface IDoctorExtraService
    {
        Task<bool> UpdateExtraAsync(DoctorExtra extra);
        Task<DoctorExtra?> GetExtraAsync(string doctorId);
        Task<bool> SubmitReviewAsync(DoctorReview review);
        Task<List<DoctorReview>> GetReviewsAsync(string doctorId);
    }
}
