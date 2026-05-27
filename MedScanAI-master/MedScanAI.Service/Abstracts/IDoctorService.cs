using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Service.Abstracts
{
    public interface IDoctorService
    {
        Task<ReturnBase<bool>> DeleteDoctorAsync(string doctorId);
        Task<ReturnBase<bool>> RestoreDoctorAsync(string doctorId);
        Task<ReturnBase<IQueryable<Domain.Entities.Doctor>>> GetAllDoctorsAsync();
        Task<ReturnBase<IQueryable<Domain.Entities.Doctor>>> GetActiveDoctorsAsync();
        Task<ReturnBase<int>> GetAllDoctorsCountAsync();
        Task<ReturnBase<int>> GetActiveDoctorsCountAsync();
        Task<ReturnBase<GetDoctorAppointmentsAndDoctorInfoResponse>> GetDoctorAppointmentsAndDoctorInfoAsync(string doctorId);
    }
}
