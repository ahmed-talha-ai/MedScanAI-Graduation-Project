using MedScanAI.API.Base;
using MedScanAI.Core.Features.DiagnosisFeature.Command;
using MedScanAI.Core.Features.DiagnosisFeature.Query;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedScanAI.API.Controllers
{
    [Route("api/diagnosis")]
    [ApiController]
    [Authorize(Roles = "Patient,Doctor")]
    public class DiagnosisController : AppControllerBase
    {
        [HttpPost("save")]
        public async Task<IActionResult> SaveDiagnosis([FromBody] SaveDiagnosisCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }

        [HttpGet("history/{patientId}")]
        public async Task<IActionResult> GetHistory(string patientId)
        {
            var result = await Mediator.Send(new GetDiagnosisHistoryQuery { PatientId = patientId });
            return ReturnResult(result);
        }

        [HttpGet("history/{patientId}/{modelType}")]
        public async Task<IActionResult> GetHistoryByModel(string patientId, string modelType)
        {
            var result = await Mediator.Send(new GetDiagnosisHistoryQuery { PatientId = patientId, ModelType = modelType });
            return ReturnResult(result);
        }
    }
}
