using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Abstracts
{
    public interface ISendEmailService
    {
        Task<ReturnBase<bool>> SendEmailAsync(string email, string message, string subject, string contentType = "text/plain");
    }
}
