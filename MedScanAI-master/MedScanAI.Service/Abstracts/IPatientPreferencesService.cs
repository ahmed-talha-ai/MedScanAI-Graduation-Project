using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Abstracts
{
    public class PatientPreferencesDto
    {
        public bool IsAppointmentNotificationEnabled { get; set; }
        public bool IsCampaignNotificationEnabled { get; set; }
        public string PreferredLanguage { get; set; } = "ar";
    }

    public interface IPatientPreferencesService
    {
        Task<ReturnBase<PatientPreferencesDto>> GetPreferencesAsync(string patientId);
        Task<ReturnBase<string>> UpdatePreferencesAsync(string patientId, PatientPreferencesDto dto);
    }
}
