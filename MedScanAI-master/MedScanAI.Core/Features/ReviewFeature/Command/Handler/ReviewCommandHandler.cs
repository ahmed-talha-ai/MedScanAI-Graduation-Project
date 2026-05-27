using MediatR;
using MedScanAI.Core.Features.ReviewFeature.Command.Model;
using MedScanAI.Domain.Entities;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.ReviewFeature.Command.Handler
{
    public class ReviewCommandHandler : IRequestHandler<SubmitWebsiteReviewCommand, ReturnBase<bool>>
    {
        private readonly IReviewService _reviewService;

        public ReviewCommandHandler(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        public async Task<ReturnBase<bool>> Handle(SubmitWebsiteReviewCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var review = new WebsiteReview
                {
                    PatientId = request.PatientId,
                    FirstName = request.FirstName,
                    Rating = request.Rating,
                    Comment = request.Comment
                };

                var result = await _reviewService.SubmitAsync(review);
                if (result)
                    return ReturnBaseHandler.Success(true, "Review submitted successfully");
                
                return ReturnBaseHandler.Failed<bool>("Failed to submit review");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
