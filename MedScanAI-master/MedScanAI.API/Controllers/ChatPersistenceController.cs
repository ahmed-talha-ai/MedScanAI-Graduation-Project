using MedScanAI.API.Base;
using MedScanAI.Core.Features.ChatFeature.Command;
using MedScanAI.Core.Features.ChatFeature.Query;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedScanAI.API.Controllers
{
    [Route("api/chat")]
    [ApiController]
    [Authorize(Roles = "Patient,Doctor")]
    public class ChatPersistenceController : AppControllerBase
    {
        [HttpPost("session/start")]
        public async Task<IActionResult> StartSession([FromBody] StartChatSessionCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }

        [HttpPost("message/save")]
        public async Task<IActionResult> SaveMessage([FromBody] SaveChatMessageCommand command)
        {
            var result = await Mediator.Send(command);
            return ReturnResult(result);
        }

        [HttpGet("history/{patientId}")]
        public async Task<IActionResult> GetHistory(string patientId)
        {
            var result = await Mediator.Send(new GetChatHistoryQuery { PatientId = patientId });
            return ReturnResult(result);
        }
    }
}
