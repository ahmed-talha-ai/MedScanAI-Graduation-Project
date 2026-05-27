using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;
using Microsoft.AspNetCore.Http;

namespace MedScanAI.Service.Abstracts
{
    public interface IAIService
    {
        Task<ReturnBase<ModelResponse>> GetBrainTumorModelResponseAsync(IFormFile image, string userRole);
        Task<ReturnBase<ModelResponse>> GetBreastCancerModelResponseAsync(IFormFile image, string userRole);
        Task<ReturnBase<ModelResponse>> GetDermatologyModelResponseAsync(IFormFile image, string userRole);
        Task<ReturnBase<ModelResponse>> GetXRayModelResponseAsync(IFormFile image, string userRole);
        Task<ReturnBase<LabModelResponse>> GetLabResultsModelResponseAsync(IFormFile image, string userRole);
        Task<ReturnBase<ChatbotResponse>> GetChatbotResponseAsync(string message, string userRole);
        Task<ReturnBase<bool>> GenerateMedicalReportAsync(string patientId);
    }
}
