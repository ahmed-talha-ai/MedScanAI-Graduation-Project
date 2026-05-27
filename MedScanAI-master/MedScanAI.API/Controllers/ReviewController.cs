using MedScanAI.API.Base;
using MedScanAI.Core.Features.ReviewFeature.Command.Model;
using MedScanAI.Core.Features.ReviewFeature.Query.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MedScanAI.API.Controllers
{
    [Route("api/review/[action]")]
    [EnableRateLimiting("SlidingWindowPolicy")]
    public class ReviewController : AppControllerBase
    {
        [HttpPost]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> Submit([FromBody] SubmitWebsiteReviewCommand command)
        {
            var response = await Mediator.Send(command);
            return ReturnResult(response);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var response = await Mediator.Send(new GetAllWebsiteReviewsQuery());
            return ReturnResult(response);
        }
    }
}
