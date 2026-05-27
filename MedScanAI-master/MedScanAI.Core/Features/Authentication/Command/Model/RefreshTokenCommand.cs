using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.Authentication.Command.Model
{
    public class RefreshTokenCommand : IRequest<ReturnBase<string>>
    {
        public string AccessToken { get; set; } = null!;
    }
}
