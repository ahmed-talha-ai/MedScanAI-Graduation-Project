using MedScanAI.Domain.Entities;
using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Abstracts
{
    public interface IAuthenticationService
    {
        Task<ReturnBase<bool>> RegisterPatientAsync(Patient patient, string password);
        Task<ReturnBase<bool>> RegisterDoctorAsync(Doctor doctor, List<string> workDays, TimeSpan startTime, TimeSpan endTime, string password);
        Task<ReturnBase<bool>> RegisterAdminAsync(ApplicationUser user, string password);
        Task<ReturnBase<string>> LoginAsync(string email, string password);
        Task<ReturnBase<bool>> ResetPasswordAsync(string resetPasswordToken, string newPassword, string email);
        Task<ReturnBase<bool>> SendResetPasswordEmailAsync(string email);
        Task<ReturnBase<string>> RefreshTokenAsync(string accessToken);
        Task<ReturnBase<bool>> ChangePasswordAsync(string newPassword, string currentPassword, string userId);
    }
}
