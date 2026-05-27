using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.ChronicDiseaseFeature.Command.Model
{
    public class AddChronicDiseaseCommand : IRequest<ReturnBase<bool>>
    {
        public string PatientId { get; set; }
        public string Name { get; set; }
    }
}
