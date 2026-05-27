using MediatR;
using MedScanAI.Core.Features.ReviewFeature.Query.Model;
using MedScanAI.Core.Features.ReviewFeature.Query.Response;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.ReviewFeature.Query.Handler
{
    public class ReviewQueryHandler : IRequestHandler<GetAllWebsiteReviewsQuery, ReturnBase<List<WebsiteReviewResponse>>>
    {
        private readonly IReviewService _reviewService;

        public ReviewQueryHandler(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        public async Task<ReturnBase<List<WebsiteReviewResponse>>> Handle(GetAllWebsiteReviewsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var reviews = await _reviewService.GetAllAsync();
                
                var response = reviews.Select(r => new WebsiteReviewResponse
                {
                    Id = r.Id,
                    PatientId = r.PatientId,
                    FirstName = r.FirstName,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                }).ToList();

                return ReturnBaseHandler.Success(response, "Website reviews retrieved successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<WebsiteReviewResponse>>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
