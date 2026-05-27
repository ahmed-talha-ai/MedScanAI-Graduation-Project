using MedScanAI.Domain.Entities;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Service.Abstracts
{
    public interface IPatientProfileService
    {
        Task<ReturnBase<bool>> CreatePatientProfileAsync(List<string> ChronicDiseases, List<string> CurrentMedication, List<string> Allergies, string patientId);

        Task<ReturnBase<GetPatientProfileResponse>> GetPatientProfileAsync(string patientId);
        Task<ReturnBase<bool>> UpdatePatientProfileAsync(Patient patient);
    }
}
