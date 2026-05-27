using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.PatientFeature.Command.Model
{
    public class CreatePatientProfileCommand : IRequest<ReturnBase<bool>>
    {
        public string PatientId { get; set; }
        public List<string> ChronicDiseases { get; set; }
        public List<string> CurrentMedication { get; set; }
        public List<string> Allergies { get; set; }
    }
}
