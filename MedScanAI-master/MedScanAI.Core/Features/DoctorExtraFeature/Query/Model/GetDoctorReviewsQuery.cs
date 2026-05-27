using MediatR;
using MedScanAI.Core.Features.DoctorExtraFeature.Query.Response;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.DoctorExtraFeature.Query.Model
{
    public class GetDoctorReviewsQuery : IRequest<ReturnBase<List<GetDoctorReviewsResponse>>>
    {
        public string DoctorId { get; set; }
    }
}
