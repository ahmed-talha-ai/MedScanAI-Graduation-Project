using MediatR;
using MedScanAI.Core.Features.ReviewFeature.Query.Response;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.ReviewFeature.Query.Model
{
    public class GetAllWebsiteReviewsQuery : IRequest<ReturnBase<List<WebsiteReviewResponse>>>
    {
    }
}
