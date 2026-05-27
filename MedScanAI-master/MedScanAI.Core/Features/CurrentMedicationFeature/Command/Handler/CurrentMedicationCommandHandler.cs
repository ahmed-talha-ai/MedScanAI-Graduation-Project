using AutoMapper;
using MediatR;
using MedScanAI.Core.Features.CurrentMedicationFeature.Command.Model;
using MedScanAI.Core.Features.PatientFeature.Command.Model;
using MedScanAI.Domain.Entities;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.CurrentMedicationFeature.Command.Handler
{
    public class CurrentMedicationCommandHandler : IRequestHandler<AddCurrentMedicationCommand, ReturnBase<bool>>,
        IRequestHandler<UpdatePatientCurrentMedicationCommand, ReturnBase<bool>>,
        IRequestHandler<DeletePatientCurrentMedicationCommand, ReturnBase<bool>>
    {

        private readonly IMapper _mapper;
        private readonly ICurrentMedicationService _currentMedicationService;

        public CurrentMedicationCommandHandler(IMapper mapper, ICurrentMedicationService currentMedicationService)
        {
            _mapper = mapper;
            _currentMedicationService = currentMedicationService;
        }

        public async Task<ReturnBase<bool>> Handle(AddCurrentMedicationCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var currentMedicationEntity = _mapper.Map<PatientCurrentMedication>(request);

                var addCurrentMedicationResult = await _currentMedicationService.AddCurrentMedicationAsync(currentMedicationEntity);

                if (!addCurrentMedicationResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(addCurrentMedicationResult.Message);

                return ReturnBaseHandler.Success(true, addCurrentMedicationResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(UpdatePatientCurrentMedicationCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var currentMedication = _mapper.Map<PatientCurrentMedication>(request.CurrentMedication);
                var updateCurrentMedicationResult = await _currentMedicationService.UpdatePatientCurrentMedicationAsync(currentMedication);
                if (!updateCurrentMedicationResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(updateCurrentMedicationResult.Message);
                return ReturnBaseHandler.Success(true, updateCurrentMedicationResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(DeletePatientCurrentMedicationCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var deleteResult = await _currentMedicationService.DeletePatientCurrentMedicationAsync(request.Id);
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
