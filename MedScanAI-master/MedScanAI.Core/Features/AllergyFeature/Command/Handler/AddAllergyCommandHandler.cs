using AutoMapper;
using MediatR;
using MedScanAI.Core.Features.AllergyFeature.Command.Model;
using MedScanAI.Domain.Entities;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.AllergyFeature.Command.Handler
{
    public class AddAllergyCommandHandler : IRequestHandler<AddAllergyCommand, ReturnBase<bool>>,
        IRequestHandler<UpdatePatientAllergyCommand, ReturnBase<bool>>,
        IRequestHandler<DeletePatientAllergyCommand, ReturnBase<bool>>
    {
        private readonly IMapper _mapper;
        private readonly IAllergyService _allergyService;
        public AddAllergyCommandHandler(IMapper mapper, IAllergyService allergyService)
        {
            _mapper = mapper;
            _allergyService = allergyService;
        }
        public async Task<ReturnBase<bool>> Handle(AddAllergyCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var allergyEntity = _mapper.Map<PatientAllergy>(request);

                var addAllergyResult = await _allergyService.AddAllergyAsync(allergyEntity);

                if (!addAllergyResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(addAllergyResult.Message);

                return ReturnBaseHandler.Success(addAllergyResult.Data, addAllergyResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(UpdatePatientAllergyCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var allergies = _mapper.Map<PatientAllergy>(request.Allergy);
                var updateAllergyResult = await _allergyService.UpdatePatientAllergyAsync(allergies);
                if (!updateAllergyResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(updateAllergyResult.Message);
                return ReturnBaseHandler.Success(true, updateAllergyResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(DeletePatientAllergyCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var deleteResult = await _allergyService.DeletePatientAllergyAsync(request.Id);
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
