using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Implementation
{
    internal class CurrentMedicationService : ICurrentMedicationService
    {
        private readonly ICurrentMedicationRepository _currentMedicationRepository;

        public CurrentMedicationService(ICurrentMedicationRepository currentMedicationRepository)
        {
            _currentMedicationRepository = currentMedicationRepository;
        }

        public async Task<ReturnBase<bool>> AddCurrentMedicationAsync(PatientCurrentMedication currentMedication)
        {
            try
            {
                var addingResult = await _currentMedicationRepository.AddAsync(currentMedication);

                if (!addingResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(addingResult.Message);

                return ReturnBaseHandler.Success<bool>(true, "Current medication added successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> DeletePatientCurrentMedicationAsync(int Id)
        {
            try
            {
                var deleteResult = await _currentMedicationRepository.DeleteAsync(Id);
                if (!deleteResult.Succeeded)
                {
                    return ReturnBaseHandler.Failed<bool>(deleteResult.Message);
                }
                return ReturnBaseHandler.Success(true, "Patient current medication deleted successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> UpdatePatientCurrentMedicationAsync(PatientCurrentMedication patientCurrentMedication)
        {
            try
            {
                var updateResult = await _currentMedicationRepository.UpdateAsync(patientCurrentMedication);
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
