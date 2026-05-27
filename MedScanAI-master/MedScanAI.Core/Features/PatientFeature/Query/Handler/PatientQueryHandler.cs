using MediatR;
using MedScanAI.Core.Features.PatientFeature.Query.Model;
using MedScanAI.Core.Features.PatientFeature.Query.Response;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Core.Features.PatientFeature.Query.Handler
{
    public class PatientQueryHandler :
        IRequestHandler<GetPatientProfileQuery, ReturnBase<GetPatientProfileResponse>>,
        IRequestHandler<GetPatientsCountQuery, ReturnBase<GetPatientsCountResponse>>
    {
        private readonly IPatientProfileService _patientProfileService;
        private readonly IPatientService _patientService;

        public PatientQueryHandler(IPatientProfileService patientProfileService, IPatientService patientService)
        {
            _patientProfileService = patientProfileService;
            _patientService = patientService;
        }

        public async Task<ReturnBase<GetPatientProfileResponse>> Handle(GetPatientProfileQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _patientProfileService.GetPatientProfileAsync(request.PatientId);

                if (!result.Succeeded)
                    return ReturnBaseHandler.Failed<GetPatientProfileResponse>(result.Message);


                return ReturnBaseHandler.Success(result.Data!, "Patient profile retrieved successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<GetPatientProfileResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<GetPatientsCountResponse>> Handle(GetPatientsCountQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _patientService.GetPatientsCountAsync();

                if (!result.Succeeded)
                    return ReturnBaseHandler.Failed<GetPatientsCountResponse>(result.Message);

                return ReturnBaseHandler.Success(new GetPatientsCountResponse { Count = result.Data }, "Patients count retrieved successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<GetPatientsCountResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
