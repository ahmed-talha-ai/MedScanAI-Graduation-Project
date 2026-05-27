using MedScanAI.Domain.Entities;
using MedScanAI.Domain.Helpers;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MedScanAI.Service.Implementation
{
    internal class AuthenticationService : IAuthenticationService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfirmEmailService _confirmEmailService;
        private readonly AppDbContext _dbContext;
        private readonly JwtSettings _jwtSettings;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISendEmailService _emailService;
        private readonly IDoctorScheduleRepository _doctorScheduleRepository;

        public AuthenticationService(UserManager<ApplicationUser> userManager, IConfirmEmailService confirmEmailService, AppDbContext dbContext, JwtSettings jwtSettings, IHttpContextAccessor httpContextAccessor, ISendEmailService emailService, RoleManager<IdentityRole> roleManager, IDoctorScheduleRepository doctorScheduleRepository)
        {
            this._userManager = userManager;
            this._roleManager = roleManager;
            this._confirmEmailService = confirmEmailService;
            this._dbContext = dbContext;
            this._jwtSettings = jwtSettings;
            this._httpContextAccessor = httpContextAccessor;
            this._emailService = emailService;
            this._doctorScheduleRepository = doctorScheduleRepository;
        }

        public async Task<ReturnBase<bool>> RegisterPatientAsync(Patient patient, string password)
        {
            var response = new ReturnBase<bool>();

            try
            {
                var appUser = new ApplicationUser
                {
                    Id = Guid.NewGuid().ToString(),
                    UserName = patient.FullName,
                    NormalizedUserName = patient.FullName.ToUpper(),
                    Email = patient.Email,
                    NormalizedEmail = patient.Email.ToUpper(),
                    PhoneNumber = patient.PhoneNumber,
                    PhoneNumberConfirmed = true
                };

                var result = await _userManager.CreateAsync(appUser, password);

                if (!result.Succeeded)
                {
                    response.Succeeded = false;
                    response.Message = "Failed to create user: " + string.Join(", ", result.Errors.Select(e => e.Description));
                    return response;
                }

                if (await _roleManager.RoleExistsAsync("Patient"))
                {
                    await _userManager.AddToRoleAsync(appUser, "Patient");
                }

                patient.Id = appUser.Id;
                patient.ApplicationUser = appUser;
                patient.CreatedAt = DateTime.UtcNow;
                patient.UpdatedAt = DateTime.UtcNow;


                _dbContext.Patients.Add(patient);
                await _dbContext.SaveChangesAsync();

                response.Succeeded = true;
                response.Data = true;

                var sendConfirmationEmailResult = await _confirmEmailService.SendConfirmationEmailAsync(appUser);

                while (!sendConfirmationEmailResult.Succeeded)
                    sendConfirmationEmailResult = await _confirmEmailService.SendConfirmationEmailAsync(appUser);

                response.Message = "Patient registered successfully. Please, confirm your email address";
            }
            catch (Exception ex)
            {
                response.Succeeded = false;
                response.Message = "Error while registering patient: " + ex.Message;
                response.Data = false;
            }

            return response;
        }
        public async Task<ReturnBase<bool>> RegisterDoctorAsync(Doctor doctor, List<string> workDays, TimeSpan startTime, TimeSpan endTime, string password)
        {
            var response = new ReturnBase<bool>();

            try
            {
                var appUser = new ApplicationUser
                {
                    Id = Guid.NewGuid().ToString(),
                    UserName = doctor.FullName,
                    NormalizedUserName = doctor.FullName.ToUpper(),
                    Email = doctor.Email,
                    NormalizedEmail = doctor.Email.ToUpper(),
                    EmailConfirmed = true,
                    PhoneNumber = doctor.PhoneNumber,
                    PhoneNumberConfirmed = true
                };

                var result = await _userManager.CreateAsync(appUser, password);

                if (!result.Succeeded)
                {
                    response.Succeeded = false;
                    response.Message = "Failed to create user: " + string.Join(", ", result.Errors.Select(e => e.Description));
                    return response;
                }

                if (await _roleManager.RoleExistsAsync("Doctor"))
                {
                    await _userManager.AddToRoleAsync(appUser, "Doctor");
                }

                doctor.Id = appUser.Id;
                doctor.ApplicationUser = appUser;
                doctor.CreatedAt = DateTime.UtcNow;
                doctor.UpdatedAt = DateTime.UtcNow;

                _dbContext.Doctors.Add(doctor);
                await _dbContext.SaveChangesAsync();

                foreach (var day in workDays)
                {
                    var doctorSchedule = new DoctorSchedule
                    {
                        DoctorId = doctor.Id,
                        DayOfWeek = day,
                        StartTime = startTime,
                        EndTime = endTime,
                    };
                    await _doctorScheduleRepository.AddAsync(doctorSchedule);
                }

                response.Succeeded = true;
                response.Message = "Doctor registered successfully.";
                response.Data = true;
            }
            catch (Exception ex)
            {
                response.Succeeded = false;
                response.Message = "Error while registering doctor: " + ex.Message;
                response.Data = false;
            }

            return response;
        }
        public async Task<ReturnBase<string>> LoginAsync(string email, string password)
        {
            try
            {
                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                    return ReturnBaseHandler.Failed<string>("Invalid Credentials");

                ApplicationUser? user = await _userManager.FindByEmailAsync(email);
                if (user is null)
                    return ReturnBaseHandler.Failed<string>("Wrong Email Or Password");

                bool isPasswordCorrect = await _userManager.CheckPasswordAsync(user, password);

                if (!isPasswordCorrect)
                {
                    var attemptCount = await _userManager.GetAccessFailedCountAsync(user);
                    if (attemptCount == 4)
                    {
                        if (user.LockoutEnabled)
                            return ReturnBaseHandler.Failed<string>($"Your account has been locked due to multiple failed login attempts. Please try again at {user.LockoutEnd?.ToLocalTime().ToString("f")}");

                        user.LockoutEnabled = true;
                        user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
                        await _userManager.UpdateAsync(user);

                        return ReturnBaseHandler.Failed<string>($"Your account has been locked due to multiple failed login attempts. Please try again at {user.LockoutEnd?.ToLocalTime().ToString("f")}");
                    }
                    await _userManager.AccessFailedAsync(user);

                    return ReturnBaseHandler.Failed<string>($"Wrong Email Or Password. {5 - user.AccessFailedCount} trials left");
                }

                if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
                {
                    return ReturnBaseHandler.Failed<string>($"Your account is locked until {user.LockoutEnd.Value.ToLocalTime().ToString("f")}");
                }

                string jwtId = Guid.NewGuid().ToString();
                string token = await GenerateJwtToken(user, jwtId);

                await BuildRefreshToken(user, jwtId);

                await _dbContext.SaveChangesAsync();

                //if (!user.EmailConfirmed)
                //{
                //    ReturnBase<bool> sendConfirmationEmailResult = await _confirmEmailService.SendConfirmationEmailAsync(user);
                //    if (sendConfirmationEmailResult.Succeeded)
                //    {
                //        return ReturnBaseHandler.Success<string>($"A Confirmation Email has been sent to {user.Email}. Please confirm your email first and then log in.");
                //    }
                //}
                return ReturnBaseHandler.Success(token, "Logged in successfully");

            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<string>(ex.InnerException.Message);
            }
        }
        public async Task<ReturnBase<string>> RefreshTokenAsync(string accessToken)
        {
            try
            {
                if (!IsAccessTokenExpired(accessToken))
                    return ReturnBaseHandler.Success("", "Access Token Is Valid");

                string? userId = GetUserIdFromToken(accessToken);
                string? jwtId = GetJwtIdFromToken(accessToken);

                if (jwtId is null || userId is null)
                    return ReturnBaseHandler.Failed<string>("Invalid Access Token");

                RefreshToken? storedRefreshToken = await _dbContext.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.UserId.ToString() == userId && rt.JwtId == jwtId);

                if (storedRefreshToken is null || storedRefreshToken.IsRevoked)
                    return ReturnBaseHandler.Failed<string>("Your session has expired. please log in again.");

                if (storedRefreshToken.ExpiresAt < DateTime.UtcNow)
                {
                    storedRefreshToken.IsRevoked = true;
                    _dbContext.RefreshTokens.Update(storedRefreshToken);
                    await _dbContext.SaveChangesAsync();
                    return ReturnBaseHandler.Failed<string>("Your session has expired. please log in again.");
                }

                if (!storedRefreshToken.IsUsed)
                {
                    storedRefreshToken.IsUsed = true;
                    _dbContext.RefreshTokens.Update(storedRefreshToken);
                }

                ApplicationUser? user = await _userManager.FindByIdAsync(userId);

                if (user is null)
                    return ReturnBaseHandler.Failed<string>("Invalid Access Token");

                string newJwtId = Guid.NewGuid().ToString();
                string newAccessToken = await GenerateJwtToken(user, newJwtId);

                storedRefreshToken.JwtId = newJwtId;

                await _dbContext.SaveChangesAsync();

                if (newAccessToken is null)
                    return ReturnBaseHandler.Failed<string>("FailedToGenerateNewAccessToken");

                return ReturnBaseHandler.Success(newAccessToken, "New Access Token Created");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<string>(ex.InnerException.Message);
            }
        }
        private string? GetJwtIdFromToken(string token)
        {
            JwtSecurityTokenHandler tokenHandler = new();
            JwtSecurityToken jwtToken = tokenHandler.ReadJwtToken(token);

            return jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
        }
        private string? GetUserIdFromToken(string token)
        {
            JwtSecurityTokenHandler tokenHandler = new();
            JwtSecurityToken jwtToken = tokenHandler.ReadJwtToken(token);

            return jwtToken.Claims.FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.Sub)?.Value.ToString();
        }
        private bool IsAccessTokenExpired(string accessToken)
        {
            try
            {
                JwtSecurityTokenHandler tokenHandler = new();
                if (tokenHandler.ReadToken(accessToken) is not JwtSecurityToken token)
                    return true;

                DateTimeOffset expirationTime = DateTimeOffset.FromUnixTimeSeconds(long.Parse(token.Claims.First(c => c.Type == JwtRegisteredClaimNames.Exp).Value));

                return expirationTime.UtcDateTime <= DateTime.UtcNow;
            }
            catch
            {
                return true;
            }
        }
        private static string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
        private async Task BuildRefreshToken(ApplicationUser user, string jwtId)
        {
            RefreshToken newRefreshToken = new()
            {
                UserId = user.Id,
                UserRefreshToken = GenerateRefreshToken(),
                JwtId = jwtId,
                IsUsed = false,
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMonths(_jwtSettings.RefreshTokenExpireDate)
            };

            RefreshToken? existingRefreshTokenRecord = await _dbContext.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.UserId == user.Id);

            if (existingRefreshTokenRecord is null)
            {
                await _dbContext.RefreshTokens.AddAsync(newRefreshToken);
            }
            else
            {
                existingRefreshTokenRecord.UserRefreshToken = GenerateRefreshToken();
                existingRefreshTokenRecord.CreatedAt = DateTime.UtcNow;
                existingRefreshTokenRecord.ExpiresAt = DateTime.UtcNow.AddMonths(_jwtSettings.RefreshTokenExpireDate);

                _dbContext.RefreshTokens.Update(existingRefreshTokenRecord);
            }

            await _dbContext.SaveChangesAsync();
        }
        private async Task<List<Claim>> GetClaimsAsync(ApplicationUser user, string jwtId)
        {
            var roles = await _userManager.GetRolesAsync(user);
            List<Claim> claims =
            [
                new Claim("UserId", user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, jwtId),
            ];
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
            var userClaims = await _userManager.GetClaimsAsync(user);
            claims.AddRange(userClaims);
            return claims;
        }
        private async Task<string> GenerateJwtToken(ApplicationUser user, string jwtId)
        {
            List<Claim> claims = await GetClaimsAsync(user, jwtId);

            SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
            SigningCredentials creds = new(key, SecurityAlgorithms.HmacSha256);

            JwtSecurityToken token = new(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.Now.AddDays(_jwtSettings.AccessTokenExpireDate),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        public async Task<ReturnBase<bool>> SendResetPasswordEmailAsync(string email)
        {
            try
            {
                if (email is null)
                    return ReturnBaseHandler.Failed<bool>("Email is required");

                ApplicationUser? user = await _userManager.FindByEmailAsync(email);

                if (user is null)
                    return ReturnBaseHandler.Failed<bool>("User Not Found");

                string resetPasswordToken = await _userManager.GeneratePasswordResetTokenAsync(user);
                string encodedToken = WebUtility.UrlEncode(resetPasswordToken);

                string frontendUrl = "http://localhost:5173";
                UriBuilder uriBuilder = new()
                {
                    Scheme = new Uri(frontendUrl).Scheme,
                    Host = new Uri(frontendUrl).Host,
                    Port = new Uri(frontendUrl).Port,
                    Path = "reset-password",
                    Query = $"email={Uri.EscapeDataString(email)}&token={encodedToken}"
                };

                string returnUrl = uriBuilder.ToString();

                string message = $"To Reset Your Password Click This Link: <a href=\"{returnUrl}\">Reset Password</a>";

                var sendEmailResult = await _emailService.SendEmailAsync(email, message, "Reset Password Link", "text/html");

                if (sendEmailResult.Succeeded)
                    return ReturnBaseHandler.Success(true, "Reset password email send successfully");

                return ReturnBaseHandler.Failed<bool>(sendEmailResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException.Message);
            }
        }
        public async Task<ReturnBase<bool>> ResetPasswordAsync(string resetPasswordToken, string newPassword, string email)
        {
            try
            {
                if (string.IsNullOrEmpty(resetPasswordToken))
                    return ReturnBaseHandler.Failed<bool>("Invalid Token");

                ApplicationUser? user = await _userManager.FindByEmailAsync(email);

                if (user is null)
                    return ReturnBaseHandler.Failed<bool>("User Not Found");

                IdentityResult resetPasswordResult = await _userManager.ResetPasswordAsync(user, resetPasswordToken, newPassword);

                if (resetPasswordResult.Succeeded)
                    return ReturnBaseHandler.Success(true, "Password has been reset successfully");

                return ReturnBaseHandler.Failed<bool>(resetPasswordResult?.Errors?.FirstOrDefault()?.Description);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> ChangePasswordAsync(string newPassword, string currentPassword, string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);

                if (user is null)
                    return ReturnBaseHandler.Failed<bool>("Invlaid id");

                var changePasswordResult = await _userManager.ChangePasswordAsync(user!, currentPassword, newPassword);

                if (!changePasswordResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(changePasswordResult.Errors.FirstOrDefault()!.Description ?? "Can not change password, please try again");

                return ReturnBaseHandler.Success(true, "Password has been changed successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> RegisterAdminAsync(ApplicationUser user, string password)
        {
            try
            {
                var existingUser = await _userManager.FindByEmailAsync(user.Email);
                if (existingUser != null)
                    return ReturnBaseHandler.Failed<bool>("User with this email already exists");

                user.Id = Guid.NewGuid().ToString();

                var createUserResult = await _userManager.CreateAsync(user, password);

                if (!createUserResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(createUserResult.Errors.FirstOrDefault()?.Description ?? "Can not create user, please try again");

                var addtoRoleResult = await _userManager.AddToRoleAsync(user, "Admin");

                if (!addtoRoleResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(addtoRoleResult.Errors.FirstOrDefault()?.Description ?? "Can not add user to role, please try again");

                user.EmailConfirmed = true;

                return ReturnBaseHandler.Success(true, "User has been registered successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
