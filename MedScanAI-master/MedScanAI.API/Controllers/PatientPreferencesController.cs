using MedScanAI.Service.Abstracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace MedScanAI.API.Controllers
{
    [Route("api/patient/preferences")]
    [ApiController]
    [Authorize(Roles = "Patient")]
    public class PatientPreferencesController : ControllerBase
    {
        private readonly IPatientPreferencesService _patientPreferencesService;

        public PatientPreferencesController(IPatientPreferencesService patientPreferencesService)
        {
            _patientPreferencesService = patientPreferencesService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPreferences()
        {
            var userId = User.FindFirstValue("UserId");
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _patientPreferencesService.GetPreferencesAsync(userId);
            if (!result.Succeeded)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> UpdatePreferences([FromBody] PatientPreferencesDto dto)
        {
            var userId = User.FindFirstValue("UserId");
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _patientPreferencesService.UpdatePreferencesAsync(userId, dto);
            if (!result.Succeeded)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
