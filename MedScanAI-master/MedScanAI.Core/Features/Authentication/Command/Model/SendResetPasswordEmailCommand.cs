using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.Authentication.Command.Model
{
    public class SendResetPasswordEmailCommand : IRequest<ReturnBase<bool>>
    {
        public string Email { get; set; } = null!;
    }
}
