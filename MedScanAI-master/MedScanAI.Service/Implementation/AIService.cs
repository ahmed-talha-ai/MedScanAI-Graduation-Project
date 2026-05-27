using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;
using Microsoft.AspNetCore.Http;
using System.Net.Http.Headers;
using System.Text.Json;

namespace MedScanAI.Service.Implementation
{
    internal class AIService : IAIService
    {
        private static readonly HttpClient _httpClient = new();
        private readonly ICurrentMedicationRepository _currentMedicationRepository;
        private readonly IPatientAllergiesRepository _patientAllergiesRepository;
        private readonly IChronicDiseasesRepository _chronicDiseaseRepository;
        private readonly IPatientFamilyHistoryRepository _patientFamilyHistoryRepository;
        private readonly IAIReportRepository _aiReportRepository;

        public AIService(
            ICurrentMedicationRepository currentMedicationRepository, 
            IPatientAllergiesRepository patientAllergiesRepository, 
            IChronicDiseasesRepository chronicDiseaseRepository, 
            IPatientFamilyHistoryRepository patientFamilyHistoryRepository,
            IAIReportRepository aiReportRepository)
        {
            _currentMedicationRepository = currentMedicationRepository;
            _patientAllergiesRepository = patientAllergiesRepository;
            _chronicDiseaseRepository = chronicDiseaseRepository;
            _patientFamilyHistoryRepository = patientFamilyHistoryRepository;
            _aiReportRepository = aiReportRepository;
        }

        public async Task<ReturnBase<bool>> GenerateMedicalReportAsync(string patientId)
        {
            try
            {
                var medicationsResult = await _currentMedicationRepository.GetCurrentMedicationsByPatientId(patientId);
                var allergiesResult = await _patientAllergiesRepository.GetAllergiesByPatientId(patientId);
                var chronicDiseasesResult = await _chronicDiseaseRepository.GetChronicDiseasesByPatientId(patientId);
                var familyHistoryResult = await _patientFamilyHistoryRepository.GetFamilyHistoriesByPatientId(patientId);

                // Try to extract BloodType (usually via another service, but let's assume we update profile earlier or it's handled)

                var jsonMedicationRequest = JsonSerializer.Serialize(new
                {
                    medications = medicationsResult.Succeeded ? medicationsResult.Data : new List<string>()
                });

                var jsonConditionsRequest = JsonSerializer.Serialize(new
                {
                    conditions = chronicDiseasesResult.Succeeded ? chronicDiseasesResult.Data : new List<string>()
                });

                var jsonAllergiesRequest = JsonSerializer.Serialize(new
                {
                    allergies = allergiesResult.Succeeded ? allergiesResult.Data : new List<string>()
                });

                var jsonFamilyHistoriesRequest = JsonSerializer.Serialize(new
                {
                    family_histories = familyHistoryResult.Succeeded ? familyHistoryResult.Data : new List<string>()
                });

                var medicationContent = new StringContent(jsonMedicationRequest, System.Text.Encoding.UTF8, "application/json");
                var conditionsContent = new StringContent(jsonConditionsRequest, System.Text.Encoding.UTF8, "application/json");
                var allergiesContent = new StringContent(jsonAllergiesRequest, System.Text.Encoding.UTF8, "application/json");
                var familyHistoriesContent = new StringContent(jsonFamilyHistoriesRequest, System.Text.Encoding.UTF8, "application/json");

                var medicationUrl = $"http://localhost:8005/patient/{patientId}/medications";
                var conditionsUrl = $"http://localhost:8005/patient/{patientId}/conditions";
                var allergiesUrl = $"http://localhost:8005/patient/{patientId}/allergies";
                var familyHistoriesUrl = $"http://localhost:8005/patient/{patientId}/family-histories";

                await _httpClient.PostAsync(medicationUrl, medicationContent);
                await _httpClient.PostAsync(conditionsUrl, conditionsContent);
                await _httpClient.PostAsync(allergiesUrl, allergiesContent);
                await _httpClient.PostAsync(familyHistoriesUrl, familyHistoriesContent);


                var reportUrl = $"http://localhost:8005/report/{patientId}/doctor-report?user_role=patient";
                var reportResponse = await _httpClient.GetAsync(reportUrl);

                if (!reportResponse.IsSuccessStatusCode)
                {
                    var error = await reportResponse.Content.ReadAsStringAsync();
                    return ReturnBaseHandler.Failed<bool>($"API Error {reportResponse.StatusCode} while generating report: {error}");
                }

                var reportJson = await reportResponse.Content.ReadAsStringAsync();

                var reportData = JsonSerializer.Deserialize<JsonElement>(reportJson);

                var reportText = reportData.GetProperty("report").GetString();

                if (string.IsNullOrEmpty(reportText))
                    return ReturnBaseHandler.Failed<bool>("Failed to retrieve report text from response");


                var existingReport = await _aiReportRepository.GetPatientExistingReportAsync(patientId);

                if (existingReport.Succeeded && existingReport.Data is not null)
                {
                    existingReport.Data.Report = reportText;
                    existingReport.Data.CreatedAt = DateTime.UtcNow;

                    var updateResult = await _aiReportRepository.UpdateAsync(existingReport.Data);

                    if (!updateResult.Succeeded)
                        return ReturnBaseHandler.Failed<bool>($"Failed to update existing report: {updateResult.Message}");

                    return ReturnBaseHandler.Success(true);
                }

                var reportToStore = new AIReport()
                {
                    PatientId = patientId,
                    Report = reportText,
                    CreatedAt = DateTime.UtcNow
                };

                var storeResult = await _aiReportRepository.AddAsync(reportToStore);

                if (!storeResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>($"Failed to store generated report: {storeResult.Message}");

                return ReturnBaseHandler.Success(true);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<ModelResponse>> GetBrainTumorModelResponseAsync(IFormFile image, string userRole)
        {
            var result = await GetModelResponseAsync(image, userRole, "8001");
            return result;
        }

        public async Task<ReturnBase<ModelResponse>> GetBreastCancerModelResponseAsync(IFormFile image, string userRole)
        {
            var result = await GetModelResponseAsync(image, userRole, "8006");
            return result;
        }

        public async Task<ReturnBase<ChatbotResponse>> GetChatbotResponseAsync(string message, string userRole)
        {
            try
            {
                var jsonRequest = JsonSerializer.Serialize(new { message });
                var content = new StringContent(jsonRequest, System.Text.Encoding.UTF8, "application/json");

                var url = $"http://localhost:8005/chat?user_role={userRole}";

                var response = await _httpClient.PostAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    return ReturnBaseHandler.Failed<ChatbotResponse>($"API Error {response.StatusCode}: {error}");
                }

                var responseJson = await response.Content.ReadAsStringAsync();

                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                };

                var modelResponse = JsonSerializer.Deserialize<ChatbotResponse>(responseJson, options);

                if (modelResponse is null)
                    return ReturnBaseHandler.Failed<ChatbotResponse>("Failed to deserialize model response");

                return ReturnBaseHandler.Success(modelResponse);
            }
            catch (HttpRequestException ex)
            {
                return ReturnBaseHandler.Failed<ChatbotResponse>($"Connection failed — is FastAPI running on port 8005? {ex.Message}");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<ChatbotResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<ModelResponse>> GetDermatologyModelResponseAsync(IFormFile image, string userRole)
        {
            var result = await GetModelResponseAsync(image, userRole, "8000");
            return result;
        }

        public async Task<ReturnBase<LabModelResponse>> GetLabResultsModelResponseAsync(IFormFile image, string userRole)
        {
            try
            {
                await using var imageStream = image.OpenReadStream();
                var imageBytes = new byte[image.Length];
                await imageStream.ReadAsync(imageBytes, 0, (int)image.Length);

                using var formData = new MultipartFormDataContent();
                var imageContent = new ByteArrayContent(imageBytes);
                imageContent.Headers.ContentType = new MediaTypeHeaderValue(image.ContentType ?? "image/jpeg");

                formData.Add(imageContent, "file", image.FileName);

                var url = $"http://localhost:8005/images/analyze?user_role={userRole}";

                var response = await _httpClient.PostAsync(url, formData);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    return ReturnBaseHandler.Failed<LabModelResponse>($"API Error {response.StatusCode}: {error}");
                }

                var responseJson = await response.Content.ReadAsStringAsync();

                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                };

                var modelResponse = JsonSerializer.Deserialize<LabModelResponse>(responseJson, options);

                if (modelResponse is null)
                    return ReturnBaseHandler.Failed<LabModelResponse>("Failed to deserialize model response");

                return ReturnBaseHandler.Success(modelResponse);
            }
            catch (HttpRequestException ex)
            {
                return ReturnBaseHandler.Failed<LabModelResponse>($"Connection failed — is FastAPI running on port 8001? {ex.Message}");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<LabModelResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<ModelResponse>> GetXRayModelResponseAsync(IFormFile image, string userRole)
        {
            var result = await GetModelResponseAsync(image, userRole, "8002");
            return result;
        }

        private async Task<ReturnBase<ModelResponse>> GetModelResponseAsync(IFormFile image, string userRole, string port)
        {
            try
            {
                await using var imageStream = image.OpenReadStream();
                var imageBytes = new byte[image.Length];
                await imageStream.ReadAsync(imageBytes, 0, (int)image.Length);

                using var formData = new MultipartFormDataContent();
                var imageContent = new ByteArrayContent(imageBytes);
                imageContent.Headers.ContentType = new MediaTypeHeaderValue(image.ContentType ?? "image/jpeg");

                formData.Add(imageContent, "file", image.FileName);

                var url = $"http://localhost:{port}/predict?user_role={userRole}";

                var response = await _httpClient.PostAsync(url, formData);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    return ReturnBaseHandler.Failed<ModelResponse>($"API Error {response.StatusCode}: {error}");
                }

                var responseJson = await response.Content.ReadAsStringAsync();

                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                };

                var modelResponse = JsonSerializer.Deserialize<ModelResponse>(responseJson, options);

                if (modelResponse is null)
                    return ReturnBaseHandler.Failed<ModelResponse>("Failed to deserialize model response");

                return ReturnBaseHandler.Success(modelResponse);
            }
            catch (HttpRequestException ex)
            {
                return ReturnBaseHandler.Failed<ModelResponse>($"Connection failed — is FastAPI running on port 8001? {ex.Message}");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<ModelResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
