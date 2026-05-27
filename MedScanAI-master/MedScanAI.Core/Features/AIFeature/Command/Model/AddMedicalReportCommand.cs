using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.AIFeature.Command.Model
{
    public class AddMedicalReportCommand : IRequest<ReturnBase<bool>>
    {
        public string PatientId { get; set; }
    }
}
