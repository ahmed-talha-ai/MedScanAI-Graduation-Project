using MediatR;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedRequest;

namespace MedScanAI.Core.Features.AllergyFeature.Command.Model
{
    public class UpdatePatientAllergyCommand : IRequest<ReturnBase<bool>>
    {
        public PatientUpdateProfileSharedRequest Allergy { get; set; }
    }
}
