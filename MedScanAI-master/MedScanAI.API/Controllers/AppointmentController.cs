using MedScanAI.API.Base;
using MedScanAI.Core.Features.AppointmentFeature.Command.Model;
using MedScanAI.Core.Features.AppointmentFeature.Query.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MedScanAI.API.Controllers
{
    [Route("api/appointment/[action]")]
    [EnableRateLimiting("SlidingWindowPolicy")]
    public class AppointmentController : AppControllerBase
    {
        [HttpPost]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> BookAppointment([FromBody] BookAppointmentCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> BookAppointmentByAdmin([FromBody] BookAppointmentByAdminCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }

        [HttpGet]
        [Authorize(Roles = "Patient, Admin")]
        public async Task<IActionResult> GetDoctors([FromQuery] GetDoctorsForAppointmentsQuery query)
        {
            var result = await Mediator.Send(query);
            return ReturnResult(result);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetForToday([FromQuery] GetTodayAppointmentsQuery query)
        {
            var result = await Mediator.Send(query);
            return ReturnResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Confirm([FromBody] ConfirmAppointmentCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }

        [HttpPut]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> Complete([FromBody] CompleteAppointmentCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }

        [HttpGet]
        [Authorize(Roles = "Patient, Admin")]
        public async Task<IActionResult> GetPatientAppointments([FromQuery] GetPatientAppointmentsQuery query)
        {
            var result = await Mediator.Send(query);
            return ReturnResult(result);
        }

        [HttpPut]
        [Authorize(Roles = "Patient, Admin")]
        public async Task<IActionResult> Cancel([FromBody] CancelAppointmentCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }
    }
}
