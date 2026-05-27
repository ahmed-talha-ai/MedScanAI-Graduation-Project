using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Implementation
{
    internal class AllergyService : IAllergyService
    {
        private readonly IPatientAllergiesRepository _patientAllergiesRepository;

        public AllergyService(IPatientAllergiesRepository patientAllergiesRepository)
        {
            _patientAllergiesRepository = patientAllergiesRepository;
        }

        public async Task<ReturnBase<bool>> AddAllergyAsync(PatientAllergy allergy)
        {
            try
            {
                var result = await _patientAllergiesRepository.AddAsync(allergy);

                if (!result.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(result.Message);

                return ReturnBaseHandler.Success(result.Data, "Allergy Added Successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> DeletePatientAllergyAsync(int Id)
        {
            try
            {
                var deleteResult = await _patientAllergiesRepository.DeleteAsync(Id);
                if (!deleteResult.Succeeded)
                {
                    return ReturnBaseHandler.Failed<bool>(deleteResult.Message);
                }
                return ReturnBaseHandler.Success(true, "Patient allergy deleted successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> UpdatePatientAllergyAsync(PatientAllergy patientAllergy)
        {
            try
            {
                var updateResult = await _patientAllergiesRepository.UpdateAsync(patientAllergy);
                if (!updateResult.Succeeded)
                {
                    return ReturnBaseHandler.Failed<bool>(updateResult.Message);
                }
                return ReturnBaseHandler.Success(true);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
