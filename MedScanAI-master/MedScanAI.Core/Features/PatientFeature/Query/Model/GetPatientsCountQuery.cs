using MediatR;
using MedScanAI.Core.Features.PatientFeature.Query.Response;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.PatientFeature.Query.Model
{
    public class GetPatientsCountQuery : IRequest<ReturnBase<GetPatientsCountResponse>>
    {
    }
}
