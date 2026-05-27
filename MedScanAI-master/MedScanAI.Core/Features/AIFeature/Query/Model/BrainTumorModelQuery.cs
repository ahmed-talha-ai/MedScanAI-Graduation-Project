using MediatR;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;
using Microsoft.AspNetCore.Http;

namespace MedScanAI.Core.Features.AIFeature.Query.Model
{
    public class BrainTumorModelQuery : IRequest<ReturnBase<ModelResponse>>
    {
        public IFormFile Image { get; set; } = null!;
        public string UserRole { get; set; } = null!;
    }
}
