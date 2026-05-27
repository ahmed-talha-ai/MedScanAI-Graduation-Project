using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Implementation
{
    internal class PatientService : IPatientService
    {
        private readonly IPatientRepository _patientRepository;

        public PatientService(IPatientRepository patientRepository)
        {
            _patientRepository = patientRepository;
        }
        public async Task<ReturnBase<int>> GetPatientsCountAsync()
        {
            try
            {
                var countData = await _patientRepository.GetPatientsCountAsync();

                if (!countData.Succeeded)
                    return ReturnBaseHandler.Failed<int>(countData.Message);

                return ReturnBaseHandler.Success(countData.Data);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<int>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
