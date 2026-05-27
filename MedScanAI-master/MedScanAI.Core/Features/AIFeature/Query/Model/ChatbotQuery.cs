using MediatR;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Core.Features.AIFeature.Query.Model
{
    public class ChatbotQuery : IRequest<ReturnBase<ChatbotResponse>>
    {
        public string Message { get; set; }
        public string UserRole { get; set; }
    }
}
