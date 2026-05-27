using AutoMapper;
using MediatR;
using MedScanAI.Core.Features.ChronicDiseaseFeature.Command.Model;
using MedScanAI.Domain.Entities;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.ChronicDiseaseFeature.Command.Handler
{
    public class ChronicDiseaseCommandHandler : IRequestHandler<AddChronicDiseaseCommand, ReturnBase<bool>>,
        IRequestHandler<UpdatePatientChronicDiseaseCommand, ReturnBase<bool>>,
        IRequestHandler<DeletePatientChronicDiseaseCommand, ReturnBase<bool>>
    {
        private readonly IMapper _mapper;
        private readonly IChronicDiseaseService _chronicDiseaseService;
        public ChronicDiseaseCommandHandler(IMapper mapper, IChronicDiseaseService chronicDiseaseService)
        {
            _mapper = mapper;
            _chronicDiseaseService = chronicDiseaseService;
        }

        public async Task<ReturnBase<bool>> Handle(AddChronicDiseaseCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var chronicDisease = _mapper.Map<PatientChronicDisease>(request);

                var result = await _chronicDiseaseService.AddChronicDiseaseAsync(chronicDisease);

                if (!result.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(result.Message);

                return ReturnBaseHandler.Success(result.Data, result.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(UpdatePatientChronicDiseaseCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var chronicDisease = _mapper.Map<PatientChronicDisease>(request.ChronicDisease);
                var updateChronicDiseaseResult = await _chronicDiseaseService.UpdatePatientChronicDiseaseAsync(chronicDisease);
                if (!updateChronicDiseaseResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(updateChronicDiseaseResult.Message);
                return ReturnBaseHandler.Success(true, updateChronicDiseaseResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(DeletePatientChronicDiseaseCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var deleteResult = await _chronicDiseaseService.DeletePatientChronicDiseaseAsync(request.Id);
                if (!deleteResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(deleteResult.Message);
                return ReturnBaseHandler.Success(true, deleteResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
