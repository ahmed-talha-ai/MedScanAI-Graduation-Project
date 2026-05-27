using MediatR;
using MedScanAI.Core.Features.DoctorExtraFeature.Query.Response;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.DoctorExtraFeature.Query.Model
{
    public class GetDoctorExtraQuery : IRequest<ReturnBase<GetDoctorExtraResponse>>
    {
        public string DoctorId { get; set; }
    }
}
