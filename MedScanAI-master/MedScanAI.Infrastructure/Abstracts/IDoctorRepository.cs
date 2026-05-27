using MedScanAI.Domain.Entities;
using MedScanAI.Domain.IBaseRepository;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Infrastructure.Abstracts
{
    public interface IDoctorRepository : IBaseRepository<Doctor>
    {
        Task<ReturnBase<GetDoctorAppointmentsAndDoctorInfoResponse>> GetDoctorAppointmentsAndDoctorInfoAsync(string doctorId);
        Task<ReturnBase<Doctor>> GetDoctorAsync(string doctorId);
        ReturnBase<IQueryable<Doctor>> GetActiveDoctors();
        Task<ReturnBase<int>> GetAllDoctorsCountAsync();
        Task<ReturnBase<int>> GetActiveDoctorsCountAsync();
    }
}
