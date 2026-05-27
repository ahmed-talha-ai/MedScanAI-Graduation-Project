using AutoMapper;
using MediatR;
using MedScanAI.Core.Features.Authentication.Command.Model;
using MedScanAI.Domain.Entities;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.Authentication.Command.Handler
{
    public class AuthenticationCommandHandler :
        IRequestHandler<RegisterDoctorCommand, ReturnBase<bool>>,
        IRequestHandler<RegisterPatientCommand, ReturnBase<bool>>,
        IRequestHandler<RegisterAdminCommand, ReturnBase<bool>>,
        IRequestHandler<ConfirmEmailCommand, ReturnBase<bool>>,
        IRequestHandler<ResetPasswordCommand, ReturnBase<bool>>,
        IRequestHandler<SendResetPasswordEmailCommand, ReturnBase<bool>>,
        IRequestHandler<ChangePasswordCommand, ReturnBase<bool>>,
        IRequestHandler<LoginCommand, ReturnBase<string>>,
        IRequestHandler<RefreshTokenCommand, ReturnBase<string>>
    {

        private readonly IConfirmEmailService _confirmEmailService;
        private readonly IAuthenticationService _authenticationService;
        private readonly IMapper _mapper;


        public AuthenticationCommandHandler(IConfirmEmailService confirmEmailService, IAuthenticationService authenticationService, IMapper mapper)
        {
            _confirmEmailService = confirmEmailService;
            _authenticationService = authenticationService;
            _mapper = mapper;
        }

        public async Task<ReturnBase<bool>> Handle(ConfirmEmailCommand request, CancellationToken cancellationToken)
        {
            try
            {
                ReturnBase<bool> confrimEmailResult = await _confirmEmailService.ConfirmEmailAsync(request.UserId, request.Token);

                if (confrimEmailResult.Succeeded)
                {
                    return ReturnBaseHandler.Success(true, confrimEmailResult.Message);
                }
                return ReturnBaseHandler.Failed<bool>(confrimEmailResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var resetPasswordResult = await _authenticationService.ResetPasswordAsync(request.ResetPasswordToken, request.NewPassword, request.Email);

                if (!resetPasswordResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(resetPasswordResult.Message);

                return ReturnBaseHandler.Success(true, resetPasswordResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var changePasswordResult = await _authenticationService.ChangePasswordAsync(request.NewPassword, request.CurrentPassword, request.UserId);

                if (!changePasswordResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(changePasswordResult.Message);

                return ReturnBaseHandler.Success(true, changePasswordResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(SendResetPasswordEmailCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var sendResentPasswordEmailResult = await _authenticationService.SendResetPasswordEmailAsync(request.Email);

                if (!sendResentPasswordEmailResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(sendResentPasswordEmailResult.Message);

                return ReturnBaseHandler.Success(sendResentPasswordEmailResult.Data, sendResentPasswordEmailResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<string>> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var loginResult = await _authenticationService.LoginAsync(request.Email, request.Password);

                if (!loginResult.Succeeded)
                    return ReturnBaseHandler.Failed<string>(loginResult.Message);

                return ReturnBaseHandler.Success(loginResult.Data!, loginResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<string>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<string>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var refreshTokenResult = await _authenticationService.RefreshTokenAsync(request.AccessToken);

                if (!refreshTokenResult.Succeeded)
                    return ReturnBaseHandler.Failed<string>(refreshTokenResult.Message);

                return ReturnBaseHandler.Success(refreshTokenResult.Data!, refreshTokenResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<string>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(RegisterDoctorCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var mappedResult = _mapper.Map<Domain.Entities.Doctor>(request);

                var registerDoctorResult = await _authenticationService.RegisterDoctorAsync(mappedResult, request.WorkDays, request.StartTime, request.EndTime, request.Password);

                if (!registerDoctorResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(registerDoctorResult.Message);

                return ReturnBaseHandler.Success(true, registerDoctorResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> Handle(RegisterPatientCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var mappedResult = _mapper.Map<Patient>(request);

                if (request.ChronicDiseases != null)
                {
                    mappedResult.ChronicDiseases = request.ChronicDiseases.Select(c => new PatientChronicDisease { Name = c }).ToList();
                }
                
                if (request.FamilyHistory != null)
                {
                    mappedResult.FamilyHistories = request.FamilyHistory.Select(f => new PatientFamilyHistory { Name = f }).ToList();
                }

                if (request.Allergies != null)
                {
                    mappedResult.Allergies = request.Allergies.Select(a => new PatientAllergy { Name = a }).ToList();
                }

                if (request.CurrentMedications != null)
                {
                    mappedResult.CurrentMedications = request.CurrentMedications.Select(m => new PatientCurrentMedication { Name = m }).ToList();
                }

                var registerPatientResult = await _authenticationService.RegisterPatientAsync(mappedResult, request.Password);

                if (!registerPatientResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(registerPatientResult.Message);

                return ReturnBaseHandler.Success(true, registerPatientResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(RegisterAdminCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var mappedResult = _mapper.Map<ApplicationUser>(request);

                var registerAdminResult = await _authenticationService.RegisterAdminAsync(mappedResult, request.Password);

                if (!registerAdminResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(registerAdminResult.Message);

                return ReturnBaseHandler.Success(true, registerAdminResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}