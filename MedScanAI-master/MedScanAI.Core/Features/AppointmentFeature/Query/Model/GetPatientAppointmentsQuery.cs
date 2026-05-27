using MediatR;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Core.Features.AppointmentFeature.Query.Model
{
    public class GetPatientAppointmentsQuery : IRequest<ReturnBase<List<GetPatientAppointmentsResponse>>>
    {
        public string PatientId { get; set; }
    }
}
