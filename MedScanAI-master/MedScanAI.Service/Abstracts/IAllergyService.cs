using MedScanAI.Domain.Entities;
using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Abstracts
{
    public interface IAllergyService
    {
        Task<ReturnBase<bool>> AddAllergyAsync(PatientAllergy allergy);
        Task<ReturnBase<bool>> UpdatePatientAllergyAsync(PatientAllergy patientAllergy);
        Task<ReturnBase<bool>> DeletePatientAllergyAsync(int Id);
    }
}
