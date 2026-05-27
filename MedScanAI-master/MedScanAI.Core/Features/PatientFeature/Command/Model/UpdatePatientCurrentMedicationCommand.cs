using MediatR;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedRequest;

namespace MedScanAI.Core.Features.PatientFeature.Command.Model
{
    public class UpdatePatientCurrentMedicationCommand : IRequest<ReturnBase<bool>>
    {
        public PatientUpdateProfileSharedRequest CurrentMedication { get; set; }
    }
}
