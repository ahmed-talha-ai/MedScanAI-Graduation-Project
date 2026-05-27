using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Implementation
{
    internal class ChronicDiseaseService : IChronicDiseaseService
    {
        private readonly IChronicDiseasesRepository _chronicDiseasesRepository;
        public ChronicDiseaseService(IChronicDiseasesRepository chronicDiseasesRepository)
        {
            _chronicDiseasesRepository = chronicDiseasesRepository;
        }

        public async Task<ReturnBase<bool>> AddChronicDiseaseAsync(PatientChronicDisease chronicDisease)
        {
            try
            {
                if (chronicDisease is null)
                    return ReturnBaseHandler.Failed<bool>("Please, Provide a valid chronic disease.");

                var result = await _chronicDiseasesRepository.AddAsync(chronicDisease);

                if (!result.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(result.Message);

                return ReturnBaseHandler.Success(result.Data, "Chronic disease added successfully.");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> DeletePatientChronicDiseaseAsync(int Id)
        {
            try
            {
                var deleteResult = await _chronicDiseasesRepository.DeleteAsync(Id);
                if (!deleteResult.Succeeded)
                {
                    return ReturnBaseHandler.Failed<bool>(deleteResult.Message);
                }
                return ReturnBaseHandler.Success(true, "Patient chronic disease deleted successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> UpdatePatientChronicDiseaseAsync(PatientChronicDisease patientChronicDisease)
        {
            try
            {
                var updateResult = await _chronicDiseasesRepository.UpdateAsync(patientChronicDisease);
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
