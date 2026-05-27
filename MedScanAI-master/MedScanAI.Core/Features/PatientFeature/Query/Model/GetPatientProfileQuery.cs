using MediatR;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Core.Features.PatientFeature.Query.Model
{
    public class GetPatientProfileQuery : IRequest<ReturnBase<GetPatientProfileResponse>>
    {
        public string PatientId { get; set; }
    }
}
