using MedScanAI.Domain.Entities;
using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Abstracts
{
    public interface ICurrentMedicationService
    {
        Task<ReturnBase<bool>> AddCurrentMedicationAsync(PatientCurrentMedication currentMedication);
        Task<ReturnBase<bool>> UpdatePatientCurrentMedicationAsync(PatientCurrentMedication patientCurrentMedication);
        Task<ReturnBase<bool>> DeletePatientCurrentMedicationAsync(int Id);
    }
}
