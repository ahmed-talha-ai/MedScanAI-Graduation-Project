using MedScanAI.Domain.Entities;
using MedScanAI.Domain.IBaseRepository;
using MedScanAI.Shared.Base;

namespace MedScanAI.Infrastructure.Abstracts
{
    public interface ICurrentMedicationRepository : IBaseRepository<PatientCurrentMedication>
    {
        Task<ReturnBase<List<string>>> GetCurrentMedicationsByPatientId(string patientId);
    }
}
