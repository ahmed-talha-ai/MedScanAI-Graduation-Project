using MedScanAI.Domain.Entities;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using System.Net;

namespace MedScanAI.Service.Implementation
{
    public class ConfirmEmailService : IConfirmEmailService
    {

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISendEmailService _emailService;

        public ConfirmEmailService(UserManager<ApplicationUser> userManager, IHttpContextAccessor httpContextAccessor,
                    ISendEmailService emailService)
        {
            _userManager = userManager;
            _httpContextAccessor = httpContextAccessor;
            _emailService = emailService;
        }

        public async Task<ReturnBase<bool>> SendConfirmationEmailAsync(ApplicationUser user)
        {
            try
            {
                if (user is not null)
                {
                    string code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                    string encodedToken = WebUtility.UrlEncode(code);

                    const string frontendUrl = "http://localhost:5173";

                    string confirmationUrl = $"{frontendUrl}/confirm-email?userId={user.Id}&token={encodedToken}";

                    string message = $"To Confirm Email Click Link: <a href=\"{confirmationUrl}\">Confirmation Link</a>";

                    ReturnBase<bool> sendEmailResult = await _emailService.SendEmailAsync(user.Email, message, "Confirmation Link", "text/html");

                    return ReturnBaseHandler.Success(sendEmailResult.Data == true, sendEmailResult.Message);
                }
                return ReturnBaseHandler.Failed<bool>("Can not send confirmation email");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> ConfirmEmailAsync(string userId, string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                {
                    return ReturnBaseHandler.Failed<bool>("Invalid Token");
                }
                ApplicationUser? user = await _userManager.FindByIdAsync(userId);

                if (user is null)
                    return ReturnBaseHandler.Failed<bool>("Invalid User Id");

                IdentityResult confirmEmailResult = await _userManager.ConfirmEmailAsync(user, token);

                if (confirmEmailResult.Succeeded)
                    return ReturnBaseHandler.Success(true, "Email confirmed successfully");

                return ReturnBaseHandler.Failed<bool>("Failed to confirm email address, please try again");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException.Message);
            }
        }
    }
}
