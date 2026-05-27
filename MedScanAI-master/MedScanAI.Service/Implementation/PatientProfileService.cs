using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;
using MedScanAI.Infrastructure.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Service.Implementation
{
    internal class PatientProfileService : IPatientProfileService
    {

        private readonly IChronicDiseasesRepository _chronicDiseasesRepository;
        private readonly ICurrentMedicationRepository _currentMedicationRepository;
        private readonly IPatientAllergiesRepository _patientAllergiesRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IConfirmEmailService _confirmEmailService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _dbContext;

        public PatientProfileService(IChronicDiseasesRepository chronicDiseasesRepository, ICurrentMedicationRepository currentMedicationRepository, IPatientAllergiesRepository patientAllergiesRepository, IPatientRepository patientRepository, IConfirmEmailService confirmEmailService, UserManager<ApplicationUser> userManager, AppDbContext dbContext)
        {
            _chronicDiseasesRepository = chronicDiseasesRepository;
            _currentMedicationRepository = currentMedicationRepository;
            _patientAllergiesRepository = patientAllergiesRepository;
            _patientRepository = patientRepository;
            _confirmEmailService = confirmEmailService;
            _userManager = userManager;
            _dbContext = dbContext;
        }

        public async Task<ReturnBase<bool>> CreatePatientProfileAsync(List<string> ChronicDiseases, List<string> CurrentMedication, List<string> Allergies, string patientId)
        {
            var transaction = await _chronicDiseasesRepository.BeginTransactionAsync();
            try
            {
                var chronicDiseases = ChronicDiseases
                    .Select(cd => new PatientChronicDisease { Name = cd, PatientId = patientId, Notes = "" }).ToList();

                var currentMedications = CurrentMedication
                    .Select(cm => new PatientCurrentMedication { Name = cm, PatientId = patientId }).ToList();

                var allergies = Allergies
                    .Select(a => new PatientAllergy { Name = a, PatientId = patientId }).ToList();

                var saveChronicDiseasesResult = await _chronicDiseasesRepository.AddRangeAsync(chronicDiseases);

                if (!saveChronicDiseasesResult.Succeeded)
                {
                    await transaction.RollbackAsync();
                    return ReturnBaseHandler.Failed<bool>(saveChronicDiseasesResult.Message);
                }

                var saveCurrentMedicationResult = await _currentMedicationRepository.AddRangeAsync(currentMedications);

                if (!saveCurrentMedicationResult.Succeeded)
                {
                    await transaction.RollbackAsync();
                    return ReturnBaseHandler.Failed<bool>(saveCurrentMedicationResult.Message);
                }

                var saveAllergiesResult = await _patientAllergiesRepository.AddRangeAsync(allergies);

                if (!saveAllergiesResult.Succeeded)
                {
                    await transaction.RollbackAsync();
                    return ReturnBaseHandler.Failed<bool>(saveAllergiesResult.Message);
                }

                await transaction.CommitAsync();
                return ReturnBaseHandler.Success(true, "Profile created successfully");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<GetPatientProfileResponse>> GetPatientProfileAsync(string patientId)
        {
            try
            {
                var patient = await _patientRepository.GetTableNoTracking().Data
                    .FirstOrDefaultAsync(x => x.Id == patientId);

                var chronicDiseasesResult = await _chronicDiseasesRepository.GetTableNoTracking().Data.Where(x => x.PatientId == patientId).ToListAsync();

                var currentMedicationsResult = await _currentMedicationRepository.GetTableNoTracking().Data.Where(x => x.PatientId == patientId).ToListAsync();

                var allergiesResult = await _patientAllergiesRepository.GetTableNoTracking().Data.Where(x => x.PatientId == patientId).ToListAsync();

                var familyHistoriesResult = await _dbContext.PatientFamilyHistories.AsNoTracking().Where(x => x.PatientId == patientId).ToListAsync();


                var chronicDiseasesList = chronicDiseasesResult
                    .Select(cd => new PatientHistoryResponse { PatientId = cd.PatientId, Id = cd.Id, Name = cd.Name }).ToList();

                var currentMedicationsList = currentMedicationsResult.Select(
                    cm => new PatientHistoryResponse { PatientId = cm.PatientId, Id = cm.Id, Name = cm.Name }).ToList();

                var allergiesList = allergiesResult.Select(al => new PatientHistoryResponse { PatientId = al.PatientId, Id = al.Id, Name = al.Name }).ToList();

                var familyHistoriesList = familyHistoriesResult.Select(fh => new PatientHistoryResponse { PatientId = fh.PatientId, Id = fh.Id, Name = fh.Name }).ToList();

                var response = new GetPatientProfileResponse
                {
                    Id = patientId,
                    FullName = patient?.FullName ?? "",
                    Email = patient?.Email ?? "",
                    PhoneNumber = patient?.PhoneNumber ?? "",
                    Gender = patient!.Gender,
                    DateOfBirth = patient.DateOfBirth,
                    BloodType = patient.BloodType,
                    ChronicDiseases = chronicDiseasesList,
                    CurrentMedication = currentMedicationsList,
                    Allergies = allergiesList,
                    FamilyHistory = familyHistoriesList
                };

                return ReturnBaseHandler.Success(response);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<GetPatientProfileResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> UpdatePatientProfileAsync(Patient patient)
        {
            var transaction = await _patientRepository.BeginTransactionAsync();
            try
            {
                var currentPatientResult = await _patientRepository.GetPatientAsync(patient.Id);

                if (!currentPatientResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(currentPatientResult.Message);


                var updateResult = await _patientRepository.UpdateAsync(patient);

                if (!updateResult.Succeeded)
                {
                    await transaction.RollbackAsync();
                    return ReturnBaseHandler.Failed<bool>(updateResult.Message);
                }

                var user = await _userManager.FindByIdAsync(patient.Id);

                if (user is null)
                    return ReturnBaseHandler.Failed<bool>("User not found.");

                // Update user details
                user.UserName = patient.FullName;
                user.NormalizedUserName = patient.FullName.ToUpper();
                user.Email = patient.Email;
                user.NormalizedEmail = patient.Email.ToUpper();
                user.PhoneNumber = patient.PhoneNumber;
                user.UpdatedAt = DateTime.UtcNow;


                var updateUserResult = await _userManager.UpdateAsync(user);


                if (!updateUserResult.Succeeded)
                {
                    await transaction.RollbackAsync();
                    return ReturnBaseHandler.Failed<bool>("Failed to update user details.");
                }


                // Check if email changed
                if (currentPatientResult.Data is not null && currentPatientResult.Data.Email != patient.Email)
                {
                    var sendEmailResult = await _confirmEmailService.SendConfirmationEmailAsync(user!);

                    while (!sendEmailResult.Succeeded)
                        sendEmailResult = await _confirmEmailService.SendConfirmationEmailAsync(user!);
                }

                await transaction.CommitAsync();
                return ReturnBaseHandler.Success(true);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
