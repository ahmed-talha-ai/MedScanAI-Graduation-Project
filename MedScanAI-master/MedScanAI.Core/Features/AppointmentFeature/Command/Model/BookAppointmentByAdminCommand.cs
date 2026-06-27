using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.AppointmentFeature.Command.Model
{
    public class BookAppointmentByAdminCommand : IRequest<ReturnBase<bool>>
    {
        public string? PatientId { get; set; }
        public string? PatientName { get; set; }
        public string DoctorId { get; set; }
        public DateTime Date { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "Confirmed";
    }
}
