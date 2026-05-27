using MedScanAI.API.Base;
using MedScanAI.Core.Features.PatientFeature.Command.Model;
using MedScanAI.Core.Features.PatientFeature.Query.Model;
using MedScanAI.Core.Features.PatientFeature.Query.Response;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MedScanAI.API.Controllers
{
    [Route("api/patient/[action]")]
    [EnableRateLimiting("SlidingWindowPolicy")]
    public class PatientController : AppControllerBase
    {
        [HttpPost]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> CreateProfile([FromBody] CreatePatientProfileCommand command)
        {
            ReturnBase<bool> response = await Mediator.Send(command);
            return ReturnResult(response);
        }

        [HttpPost]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> GetProfile([FromBody] GetPatientProfileQuery query)
        {
            ReturnBase<GetPatientProfileResponse> response = await Mediator.Send(query);
            return ReturnResult(response);
        }

        [HttpPut]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdatePatientProfileCommand command)
        {
            ReturnBase<bool> response = await Mediator.Send(command);
            return ReturnResult(response);
        }

        [HttpGet]
        public async Task<IActionResult> GetPatientsCount()
        {
            ReturnBase<GetPatientsCountResponse> response =
                await Mediator.Send(new GetPatientsCountQuery());
            return ReturnResult(response);
        }
    }
}
