using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.AllergyFeature.Command.Model
{
    public class DeletePatientAllergyCommand : IRequest<ReturnBase<bool>>
    {
        public int Id { get; set; }
    }
}
