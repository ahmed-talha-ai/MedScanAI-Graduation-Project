using MediatR;
using MedScanAI.Core.Features.AIFeature.Query.Model;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Core.Features.AIFeature.Query.Handler
{
    internal class AIQueryHandler :
        IRequestHandler<BrainTumorModelQuery, ReturnBase<ModelResponse>>,
        IRequestHandler<XRayModelQuery, ReturnBase<ModelResponse>>,
        IRequestHandler<DermatologyModelQuery, ReturnBase<ModelResponse>>,
        IRequestHandler<BreastCancerModelQuery, ReturnBase<ModelResponse>>,
        IRequestHandler<LabResultsModelQuery, ReturnBase<LabModelResponse>>,
        IRequestHandler<ChatbotQuery, ReturnBase<ChatbotResponse>>
    {
        private readonly IAIService _aIService;

        public AIQueryHandler(IAIService aIService)
        {
            _aIService = aIService;
        }

        public async Task<ReturnBase<ModelResponse>> Handle(BrainTumorModelQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var modelResponse = await _aIService.GetBrainTumorModelResponseAsync(request.Image, request.UserRole);

                if (!modelResponse.Succeeded)
                    return ReturnBaseHandler.Failed<ModelResponse>(modelResponse.Message);

                return ReturnBaseHandler.Success(modelResponse.Data!);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<ModelResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<ModelResponse>> Handle(XRayModelQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var modelResponse = await _aIService.GetXRayModelResponseAsync(request.Image, request.UserRole);

                if (!modelResponse.Succeeded)
                    return ReturnBaseHandler.Failed<ModelResponse>(modelResponse.Message);

                return ReturnBaseHandler.Success(modelResponse.Data!);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<ModelResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<ModelResponse>> Handle(DermatologyModelQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var modelResponse = await _aIService.GetDermatologyModelResponseAsync(request.Image, request.UserRole);

                if (!modelResponse.Succeeded)
                    return ReturnBaseHandler.Failed<ModelResponse>(modelResponse.Message);

                return ReturnBaseHandler.Success(modelResponse.Data!);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<ModelResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<ModelResponse>> Handle(BreastCancerModelQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var modelResponse = await _aIService.GetBreastCancerModelResponseAsync(request.Image, request.UserRole);

                if (!modelResponse.Succeeded)
                    return ReturnBaseHandler.Failed<ModelResponse>(modelResponse.Message);

                return ReturnBaseHandler.Success(modelResponse.Data!);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<ModelResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<LabModelResponse>> Handle(LabResultsModelQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var modelResponse = await _aIService.GetLabResultsModelResponseAsync(request.Image, request.UserRole);

                if (!modelResponse.Succeeded)
                    return ReturnBaseHandler.Failed<LabModelResponse>(modelResponse.Message);

                return ReturnBaseHandler.Success(modelResponse.Data!);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<LabModelResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<ChatbotResponse>> Handle(ChatbotQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var chatbotResponse = await _aIService.GetChatbotResponseAsync(request.Message, request.UserRole);

                if (!chatbotResponse.Succeeded)
                    return ReturnBaseHandler.Failed<ChatbotResponse>(chatbotResponse.Message);

                return ReturnBaseHandler.Success(chatbotResponse.Data!);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<ChatbotResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
