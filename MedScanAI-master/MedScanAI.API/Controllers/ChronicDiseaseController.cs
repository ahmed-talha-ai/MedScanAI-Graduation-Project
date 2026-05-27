using MedScanAI.API.Base;
using MedScanAI.Core.Features.ChronicDiseaseFeature.Command.Model;
using MedScanAI.Shared.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MedScanAI.API.Controllers
{
    [Route("api/chronicdisease/[action]")]
    [EnableRateLimiting("SlidingWindowPolicy")]
    public class ChronicDiseaseController : AppControllerBase
    {
        [HttpPost]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> AddChronicDisease([FromBody] AddChronicDiseaseCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }

        [HttpPut]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> UpdateChronicDisease([FromBody] UpdatePatientChronicDiseaseCommand command)
        {
            ReturnBase<bool> response = await Mediator.Send(command);
            return ReturnResult(response);
        }

        [HttpDelete]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> DeleteChronicDisease([FromBody] DeletePatientChronicDiseaseCommand command)
        {
            ReturnBase<bool> response = await Mediator.Send(command);
            return ReturnResult(response);
        }
    }
}
