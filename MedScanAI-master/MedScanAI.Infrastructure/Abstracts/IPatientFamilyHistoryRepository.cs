using MedScanAI.Domain.Entities;
using MedScanAI.Domain.IBaseRepository;
using MedScanAI.Shared.Base;

namespace MedScanAI.Infrastructure.Abstracts
{
    public interface IPatientFamilyHistoryRepository : IBaseRepository<PatientFamilyHistory>
    {
        Task<ReturnBase<List<string>>> GetFamilyHistoriesByPatientId(string patientId);
    }
}
