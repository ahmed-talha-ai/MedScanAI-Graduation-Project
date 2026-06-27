using MedScanAI.API.Base;
using MedScanAI.Service.Abstracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedScanAI.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WhatsAppController : AppControllerBase
    {
        private readonly IWhatsAppService _whatsAppService;

        public WhatsAppController(IWhatsAppService whatsAppService)
        {
            _whatsAppService = whatsAppService;
        }

        [HttpPost("test-breast-check")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> TestBreastCheck([FromBody] TestBreastCheckDto dto)
        {
            try
            {
                // Link is empty because the button was removed, and language is hardcoded to "ar" inside the service anyway
                await _whatsAppService.SendBreastCheckReminderAsync(dto.PhoneNumber, dto.PatientName, "", "ar");
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPost("test-appointment-reminder")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> TestAppointmentReminder([FromBody] TestAppointmentDto dto)
        {
            try
            {
                var dateStr = dto.AppointmentDate.ToString("yyyy/MM/dd", System.Globalization.CultureInfo.InvariantCulture);
                var timeStr = dto.AppointmentDate.ToString("hh:mm tt", new System.Globalization.CultureInfo("ar-EG"));

                await _whatsAppService.SendAppointmentReminderAsync(
                    dto.PhoneNumber, dto.PatientName, dateStr, timeStr, "ar_EG");
                    
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }
    }

    public record TestBreastCheckDto(string PhoneNumber, string PatientName);
    public record TestAppointmentDto(string PhoneNumber, string PatientName, string DoctorName, DateTime AppointmentDate);
}
