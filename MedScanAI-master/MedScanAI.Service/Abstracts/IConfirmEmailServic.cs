using MedScanAI.Domain.Entities;
using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Abstracts
{
    public interface IConfirmEmailService
    {
        Task<ReturnBase<bool>> SendConfirmationEmailAsync(ApplicationUser user);
        Task<ReturnBase<bool>> ConfirmEmailAsync(string userId, string token);
    }
}
