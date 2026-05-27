using MedScanAI.API.Base;
using MedScanAI.Core.Features.AllergyFeature.Command.Model;
using MedScanAI.Shared.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MedScanAI.API.Controllers
{
    [Route("api/allergy/[action]")]
    [EnableRateLimiting("SlidingWindowPolicy")]
    public class AllergyController : AppControllerBase
    {
        [HttpPost]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> AddAllergy([FromBody] AddAllergyCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }

        [HttpPut]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> UpdateAllergy([FromBody] UpdatePatientAllergyCommand command)
        {
            ReturnBase<bool> response = await Mediator.Send(command);
            return ReturnResult(response);
        }

        [HttpDelete]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> DeleteAllergy([FromBody] DeletePatientAllergyCommand command)
        {
            ReturnBase<bool> response = await Mediator.Send(command);
            return ReturnResult(response);
        }
    }
}
