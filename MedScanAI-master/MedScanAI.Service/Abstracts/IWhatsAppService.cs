using System.Threading.Tasks;

namespace MedScanAI.Service.Abstracts
{
    public interface IWhatsAppService
    {
        Task SendAppointmentReminderAsync(string phoneNumber, string patientName, string date, string time, string language);
        Task SendBreastCheckReminderAsync(string phoneNumber, string patientName, string link, string language);
        Task SendAppointmentCancellationAsync(string phoneNumber, string patientName, string date, string time, string language);
        Task SendTextMessageAsync(string phoneNumber, string message);
    }
}
