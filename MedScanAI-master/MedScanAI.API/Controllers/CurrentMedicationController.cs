using MedScanAI.API.Base;
using MedScanAI.Core.Features.CurrentMedicationFeature.Command.Model;
using MedScanAI.Core.Features.PatientFeature.Command.Model;
using MedScanAI.Shared.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MedScanAI.API.Controllers
{
    [Route("api/currentmedication/[action]")]
    [EnableRateLimiting("SlidingWindowPolicy")]
    public class CurrentMedicationController : AppControllerBase
    {

        [HttpPost]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> AddCurrentMedication([FromBody] AddCurrentMedicationCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }

        [HttpPut]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> UpdateCurrentMedication([FromBody] UpdatePatientCurrentMedicationCommand command)
        {
            ReturnBase<bool> response = await Mediator.Send(command);
            return ReturnResult(response);
        }

        [HttpDelete]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> DeleteCurrentMedication([FromBody] DeletePatientCurrentMedicationCommand command)
        {
            ReturnBase<bool> response = await Mediator.Send(command);
            return ReturnResult(response);
        }
    }
}
