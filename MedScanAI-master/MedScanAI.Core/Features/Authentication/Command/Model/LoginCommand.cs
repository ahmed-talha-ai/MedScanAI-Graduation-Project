using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.Authentication.Command.Model
{
    public class LoginCommand : IRequest<ReturnBase<string>>
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
