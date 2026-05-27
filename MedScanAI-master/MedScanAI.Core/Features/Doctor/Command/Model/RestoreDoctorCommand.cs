using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.Doctor.Command.Model
{
    public class RestoreDoctorCommand : IRequest<ReturnBase<bool>>
    {
        public string DoctorId { get; set; } = null!;
    }
}
