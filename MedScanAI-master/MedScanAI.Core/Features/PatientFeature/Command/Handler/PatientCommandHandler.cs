using AutoMapper;
using MediatR;
using MedScanAI.Core.Features.PatientFeature.Command.Model;
using MedScanAI.Domain.Entities;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.PatientFeature.Command.Handler
{
    public class PatientCommandHandler :
        IRequestHandler<CreatePatientProfileCommand, ReturnBase<bool>>,
        IRequestHandler<UpdatePatientProfileCommand, ReturnBase<bool>>
    {
        private readonly IPatientProfileService _patientProfileService;
        private readonly IMapper _mapper;

        public PatientCommandHandler(IPatientProfileService patientProfileService, IMapper mapper)
        {
            _patientProfileService = patientProfileService;
            _mapper = mapper;
        }


        public async Task<ReturnBase<bool>> Handle(CreatePatientProfileCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _patientProfileService.CreatePatientProfileAsync(
                    request.ChronicDiseases,
                    request.CurrentMedication,
                    request.Allergies,
                    request.PatientId
                );

                if (!result.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(result.Message);


                return ReturnBaseHandler.Success(true, result.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(UpdatePatientProfileCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var mappedResult = _mapper.Map<Patient>(request);

                if (request.ChronicDiseases != null)
                {
                    mappedResult.ChronicDiseases = request.ChronicDiseases.Select(c => new PatientChronicDisease { Name = c }).ToList();
                }

                if (request.FamilyHistory != null)
                {
                    mappedResult.FamilyHistories = request.FamilyHistory.Select(f => new PatientFamilyHistory { Name = f }).ToList();
                }

                if (request.Allergies != null)
                {
                    mappedResult.Allergies = request.Allergies.Select(a => new PatientAllergy { Name = a }).ToList();
                }

                if (request.CurrentMedications != null)
                {
                    mappedResult.CurrentMedications = request.CurrentMedications.Select(m => new PatientCurrentMedication { Name = m }).ToList();
                }

                var updateProfileResult = await _patientProfileService.UpdatePatientProfileAsync(mappedResult);
                if (!updateProfileResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(updateProfileResult.Message);

                return ReturnBaseHandler.Success(true, updateProfileResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
