using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.AppointmentFeature.Command.Model
{
    public class ConfirmAppointmentCommand : IRequest<ReturnBase<bool>>
    {
        public int AppointmentId { get; set; }
    }
}
