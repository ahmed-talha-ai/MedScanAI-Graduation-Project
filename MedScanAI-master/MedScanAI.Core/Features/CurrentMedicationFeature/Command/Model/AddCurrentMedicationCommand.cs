using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.CurrentMedicationFeature.Command.Model
{
    public class AddCurrentMedicationCommand : IRequest<ReturnBase<bool>>
    {
        public string PatientId { get; set; }
        public string Name { get; set; }
    }
}
