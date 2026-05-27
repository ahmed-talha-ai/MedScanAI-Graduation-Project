using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.Authentication.Command.Model
{
    public class ConfirmEmailCommand : IRequest<ReturnBase<bool>>
    {
        public string UserId { get; set; } = null!;
        public string Token { get; set; } = null!;
    }
}
