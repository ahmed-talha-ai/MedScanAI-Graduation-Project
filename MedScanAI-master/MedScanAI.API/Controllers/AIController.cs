using MedScanAI.API.Base;
using MedScanAI.Core.Features.AIFeature.Command.Model;
using MedScanAI.Core.Features.AIFeature.Query.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MedScanAI.API.Controllers
{
    [Route("api/ai/[action]")]
    [EnableRateLimiting("SlidingWindowPolicy")]
    public class AIController : AppControllerBase
    {
        [HttpPost]
        [Authorize(Roles = "Patient,Doctor")]
        public async Task<IActionResult> GetBrainTumorDiagnose([FromForm] BrainTumorModelQuery query)
        {
            var result = await Mediator.Send(query);
            return ReturnResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Patient,Doctor")]
        public async Task<IActionResult> GetBreastCancerDiagnose([FromForm] BreastCancerModelQuery query)
        {
            var result = await Mediator.Send(query);
            return ReturnResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Patient,Doctor")]
        public async Task<IActionResult> GetXRayDiagnose([FromForm] XRayModelQuery query)
        {
            var result = await Mediator.Send(query);
            return ReturnResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Patient,Doctor")]
        public async Task<IActionResult> GetDermatologyDiagnose([FromForm] DermatologyModelQuery query)
        {
            var result = await Mediator.Send(query);
            return ReturnResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Patient,Doctor")]
        public async Task<IActionResult> GetLabResults([FromForm] LabResultsModelQuery query)
        {
            var result = await Mediator.Send(query);
            return ReturnResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Patient,Doctor")]
        public async Task<IActionResult> GetChatbotResponse([FromBody] ChatbotQuery query)
        {
            var result = await Mediator.Send(query);
            return ReturnResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> GenerateMedicalReport([FromBody] AddMedicalReportCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }
    }
}
