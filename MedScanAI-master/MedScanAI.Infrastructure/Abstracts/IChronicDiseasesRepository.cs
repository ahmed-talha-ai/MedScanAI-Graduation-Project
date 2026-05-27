using MedScanAI.Domain.Entities;
using MedScanAI.Domain.IBaseRepository;
using MedScanAI.Shared.Base;

namespace MedScanAI.Infrastructure.Abstracts
{
    public interface IChronicDiseasesRepository : IBaseRepository<PatientChronicDisease>
    {
        Task<ReturnBase<List<string>>> GetChronicDiseasesByPatientId(string patientId);
    }
}
