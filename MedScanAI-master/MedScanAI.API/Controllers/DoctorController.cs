using MedScanAI.API.Base;
using MedScanAI.Core.Features.Doctor.Command.Model;
using MedScanAI.Core.Features.Doctor.Query.Model;
using MedScanAI.Core.Features.DoctorExtraFeature.Command.Model;
using MedScanAI.Core.Features.DoctorExtraFeature.Query.Model;
using MedScanAI.Shared.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MedScanAI.API.Controllers
{
    [Route("api/doctor/[action]")]
    [EnableRateLimiting("SlidingWindowPolicy")]
    public class DoctorController : AppControllerBase
    {
        [HttpPost]
        [Authorize(Roles = "Admin,Doctor")]
        public async Task<IActionResult> DeleteDoctor([FromBody] DeleteDoctorCommand command)
        {
            ReturnBase<bool> response = await Mediator.Send(command);
            return ReturnResult(response);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Doctor")]
        public async Task<IActionResult> RestoreDoctor([FromBody] RestoreDoctorCommand command)
        {
            ReturnBase<bool> response = await Mediator.Send(command);
            return ReturnResult(response);
        }

        [HttpGet]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> GetInfoAndAppointments([FromQuery] GetDoctorAppointmentsAndDoctorInfoQuery query)
        {
            var response = await Mediator.Send(query);
            return ReturnResult(response);
        }


        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll([FromQuery] GetAllDoctorsQuery query)
        {
            var response = await Mediator.Send(query);
            return ReturnResult(response);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetActive([FromQuery] GetAllActiveDoctorsQuery query)
        {
            var response = await Mediator.Send(query);
            return ReturnResult(response);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetActiveCount([FromQuery] GetActiveDoctorsCountQuery query)
        {
            var response = await Mediator.Send(query);
            return ReturnResult(response);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetCount([FromQuery] GetAllDoctorsCountQuery query)
        {
            var response = await Mediator.Send(query);
            return ReturnResult(response);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateExtra([FromBody] UpdateDoctorExtraCommand command)
        {
            var response = await Mediator.Send(command);
            return ReturnResult(response);
        }

        [HttpGet("{DoctorId}")]
        public async Task<IActionResult> GetExtra([FromRoute] GetDoctorExtraQuery query)
        {
            var response = await Mediator.Send(query);
            return ReturnResult(response);
        }

        [HttpPost]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> SubmitReview([FromBody] SubmitDoctorReviewCommand command)
        {
            var response = await Mediator.Send(command);
            return ReturnResult(response);
        }

        [HttpGet("{DoctorId}")]
        public async Task<IActionResult> GetReviews([FromRoute] GetDoctorReviewsQuery query)
        {
            var response = await Mediator.Send(query);
            return ReturnResult(response);
        }
    }
}
