using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Implementation
{
    public class PatientPreferencesService : IPatientPreferencesService
    {
        private readonly IPatientRepository _patientRepository;

        public PatientPreferencesService(IPatientRepository patientRepository)
        {
            _patientRepository = patientRepository;
        }

        public async Task<ReturnBase<PatientPreferencesDto>> GetPreferencesAsync(string patientId)
        {
            try
            {
                var patientResult = await _patientRepository.GetPatientAsync(patientId);
                if (!patientResult.Succeeded || patientResult.Data == null)
                    return ReturnBaseHandler.Failed<PatientPreferencesDto>("Patient not found.");

                var dto = new PatientPreferencesDto
                {
                    IsAppointmentNotificationEnabled = patientResult.Data.IsAppointmentNotificationEnabled,
                    IsCampaignNotificationEnabled = patientResult.Data.IsCampaignNotificationEnabled,
                    PreferredLanguage = patientResult.Data.PreferredLanguage
                };

                return ReturnBaseHandler.Success(dto);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<PatientPreferencesDto>(ex.Message);
            }
        }

        public async Task<ReturnBase<string>> UpdatePreferencesAsync(string patientId, PatientPreferencesDto dto)
        {
            try
            {
                var patientResult = await _patientRepository.GetPatientAsync(patientId);
                if (!patientResult.Succeeded || patientResult.Data == null)
                    return ReturnBaseHandler.Failed<string>("Patient not found.");

                patientResult.Data.IsAppointmentNotificationEnabled = dto.IsAppointmentNotificationEnabled;
                patientResult.Data.IsCampaignNotificationEnabled = dto.IsCampaignNotificationEnabled;
                patientResult.Data.PreferredLanguage = dto.PreferredLanguage;

                var updateResult = await _patientRepository.UpdateAsync(patientResult.Data);
                if (!updateResult.Succeeded)
                    return ReturnBaseHandler.Failed<string>("Failed to update patient preferences.");

                return ReturnBaseHandler.Success("Preferences updated successfully.");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<string>(ex.Message);
            }
        }
    }
}
