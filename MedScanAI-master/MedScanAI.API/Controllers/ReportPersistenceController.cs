using MedScanAI.API.Base;
using MedScanAI.Core.Features.ReportFeature.Command;
using MedScanAI.Core.Features.ReportFeature.Query;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedScanAI.API.Controllers
{
    [Route("api/report")]
    [ApiController]
    [Authorize(Roles = "Patient,Doctor")]
    public class ReportPersistenceController : AppControllerBase
    {
        [HttpPost("save")]
        public async Task<IActionResult> SaveReport([FromBody] SaveReportCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }

        [HttpGet("history/{patientId}")]
        public async Task<IActionResult> GetHistory(string patientId)
        {
            var result = await Mediator.Send(new GetReportHistoryQuery { PatientId = patientId });
            return ReturnResult(result);
        }

        [HttpGet("{reportId}")]
        public async Task<IActionResult> GetById(int reportId)
        {
            var result = await Mediator.Send(new GetReportByIdQuery { ReportId = reportId });
            return ReturnResult(result);
        }
    }
}
