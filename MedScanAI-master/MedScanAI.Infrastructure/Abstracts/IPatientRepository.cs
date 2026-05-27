using MedScanAI.Domain.Entities;
using MedScanAI.Domain.IBaseRepository;
using MedScanAI.Shared.Base;

namespace MedScanAI.Infrastructure.Abstracts
{
    public interface IPatientRepository : IBaseRepository<Patient>
    {
        Task<ReturnBase<Patient>> GetPatientAsync(string id);
        Task<ReturnBase<int>> GetPatientsCountAsync();
    }
}
