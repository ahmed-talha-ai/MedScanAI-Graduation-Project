using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.AllergyFeature.Command.Model
{
    public class AddAllergyCommand : IRequest<ReturnBase<bool>>
    {
        public string PatientId { get; set; }
        public string Name { get; set; }
    }
}
