using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.PatientFeature.Command.Model
{
    public class DeletePatientCurrentMedicationCommand : IRequest<ReturnBase<bool>>
    {
        public int Id { get; set; }
    }
}
