using MedScanAI.Domain.Entities;
using MedScanAI.Domain.IBaseRepository;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Infrastructure.Abstracts
{
    public interface IAppointmentRepository : IBaseRepository<Appointment>
    {
        Task<ReturnBase<List<GetDoctorsForAppointmentsResponse>>> GetDoctorsForAppointmentsAsync(string patientId);
        Task<ReturnBase<List<GetTodayAppointmentsResponse>>> GetTodayAppointmentsAsync();
        Task<ReturnBase<List<Appointment>>> GetPatientAppointmentsAsync(string? patientId);
        Task<ReturnBase<bool>> ConfirmAppointmentAsync(int appointmentId);
        Task<ReturnBase<bool>> CompleteAppointmentAsync(int appointmentId);
        Task<ReturnBase<bool>> CancelAppointmentAsync(int appointmentId);
    }
}
