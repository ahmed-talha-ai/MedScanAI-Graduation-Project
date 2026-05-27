using MediatR;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Core.Features.Doctor.Query.Model
{
    public class GetDoctorAppointmentsAndDoctorInfoQuery : IRequest<ReturnBase<GetDoctorAppointmentsAndDoctorInfoResponse>>
    {
        public string DoctorId { get; set; }
    }
}
