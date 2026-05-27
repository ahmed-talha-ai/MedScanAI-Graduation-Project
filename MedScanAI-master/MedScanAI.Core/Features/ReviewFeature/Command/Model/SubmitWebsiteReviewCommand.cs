using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.ReviewFeature.Command.Model
{
    public class SubmitWebsiteReviewCommand : IRequest<ReturnBase<bool>>
    {
        public string PatientId { get; set; }
        public string FirstName { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}
