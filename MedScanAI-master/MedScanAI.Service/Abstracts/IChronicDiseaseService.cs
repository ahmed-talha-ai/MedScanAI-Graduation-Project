using MedScanAI.Domain.Entities;
using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Abstracts
{
    public interface IChronicDiseaseService
    {
        Task<ReturnBase<bool>> AddChronicDiseaseAsync(PatientChronicDisease chronicDisease);
        Task<ReturnBase<bool>> UpdatePatientChronicDiseaseAsync(PatientChronicDisease patientChronicDisease);
        Task<ReturnBase<bool>> DeletePatientChronicDiseaseAsync(int Id);
    }
}
