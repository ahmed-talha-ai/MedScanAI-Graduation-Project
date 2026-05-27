using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.AIFeature.Command.Model
{
    public class AddMedictaionsAndConditionsCommand : IRequest<ReturnBase<bool>>
    {
        public List<string> Medications { get; set; }
        public List<string> Conditions { get; set; }
    }
}
