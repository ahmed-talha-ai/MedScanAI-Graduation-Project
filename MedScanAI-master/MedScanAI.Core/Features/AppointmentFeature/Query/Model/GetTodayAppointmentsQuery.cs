using MediatR;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Core.Features.AppointmentFeature.Query.Model
{
    public class GetTodayAppointmentsQuery : IRequest<ReturnBase<List<GetTodayAppointmentsResponse>>>
    {
    }
}
