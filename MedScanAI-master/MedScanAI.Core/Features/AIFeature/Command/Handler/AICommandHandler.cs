using MediatR;
using MedScanAI.Core.Features.AIFeature.Command.Model;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.AIFeature.Command.Handler
{
    internal class AICommandHandler : IRequestHandler<AddMedicalReportCommand, ReturnBase<bool>>
    {

        private readonly IAIService _aiService;

        public AICommandHandler(IAIService aiService)
        {
            _aiService = aiService;
        }

        public async Task<ReturnBase<bool>> Handle(AddMedicalReportCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _aiService.GenerateMedicalReportAsync(request.PatientId);

                if (!result.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(result.Message);

                return ReturnBaseHandler.Success<bool>(result.Data, result.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
