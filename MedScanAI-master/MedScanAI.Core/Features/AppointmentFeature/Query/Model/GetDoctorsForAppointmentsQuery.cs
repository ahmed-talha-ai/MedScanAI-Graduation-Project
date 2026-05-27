using MediatR;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Core.Features.AppointmentFeature.Query.Model
{
    public class GetDoctorsForAppointmentsQuery : IRequest<ReturnBase<List<GetDoctorsForAppointmentsResponse>>>
    {
        public string? PatientId { get; set; }
    }
}
