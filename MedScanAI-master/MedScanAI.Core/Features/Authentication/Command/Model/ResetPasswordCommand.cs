using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.Authentication.Command.Model
{
    public class ResetPasswordCommand : IRequest<ReturnBase<bool>>
    {
        public string Email { get; set; }
        public string NewPassword { get; set; }
        public string ResetPasswordToken { get; set; }
    }
}
