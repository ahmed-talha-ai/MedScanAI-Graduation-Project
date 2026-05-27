using MedScanAI.Domain.Entities;
using MedScanAI.Domain.IBaseRepository;
using MedScanAI.Shared.Base;

namespace MedScanAI.Infrastructure.Abstracts
{
    public interface IPatientAllergiesRepository : IBaseRepository<PatientAllergy>
    {
        Task<ReturnBase<List<string>>> GetAllergiesByPatientId(string patientId);
    }
}
