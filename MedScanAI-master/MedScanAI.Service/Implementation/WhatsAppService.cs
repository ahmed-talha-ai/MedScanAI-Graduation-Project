using MedScanAI.Service.Abstracts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace MedScanAI.Service.Implementation
{
    public class WhatsAppService : IWhatsAppService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<WhatsAppService> _logger;
        private readonly string _phoneNumberId;
        private readonly string _accessToken;

        public WhatsAppService(HttpClient httpClient, IConfiguration config, ILogger<WhatsAppService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            
            _phoneNumberId = config["WhatsAppSettings:PhoneNumberId"]
                ?? throw new InvalidOperationException("WhatsAppSettings:PhoneNumberId is not configured.");
            _accessToken = config["WhatsAppSettings:AccessToken"]
                ?? throw new InvalidOperationException("WhatsAppSettings:AccessToken is not configured.");
                
            _httpClient.BaseAddress = new Uri(config["WhatsAppSettings:ApiUrl"] ?? "https://graph.facebook.com/v25.0/");
        }

        public async Task SendAppointmentReminderAsync(string phoneNumber, string patientName, string date, string time, string language)
        {
            try
            {
                // Meta expects phone numbers without the '+' sign
                var formattedPhone = phoneNumber.StartsWith("+") ? phoneNumber.Substring(1) : phoneNumber;

                var payload = new
                {
                    messaging_product = "whatsapp",
                    to = formattedPhone,
                    type = "template",
                    template = new
                    {
                        name = "appointment_confirmation",
                        language = new { code = language },
                        components = new[]
                        {
                            new
                            {
                                type = "body",
                                parameters = new object[]
                                {
                                    new { type = "text", text = patientName },
                                    new { type = "text", text = date },
                                    new { type = "text", text = time }
                                }
                            }
                        }
                    }
                };

                var request = new HttpRequestMessage(HttpMethod.Post, $"{_phoneNumberId}/messages");
                request.Headers.Add("Authorization", $"Bearer {_accessToken}");
                request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorResponse = await response.Content.ReadAsStringAsync();
                    _logger.LogError("WhatsApp API failed with status {StatusCode}: {ErrorResponse}", response.StatusCode, errorResponse);
                }
                else
                {
                    _logger.LogInformation("Successfully sent WhatsApp appointment reminder to {PhoneNumber}", formattedPhone);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while sending WhatsApp appointment reminder to {PhoneNumber}", phoneNumber);
            }
        }

        public async Task SendBreastCheckReminderAsync(string phoneNumber, string patientName, string link, string language)
        {
            try
            {
                var formattedPhone = phoneNumber.StartsWith("+") ? phoneNumber.Substring(1) : phoneNumber;

                var payload = new
                {
                    messaging_product = "whatsapp",
                    to = formattedPhone,
                    type = "template",
                    template = new
                    {
                        name = "breast_check_reminder",
                        language = new { code = language },
                        components = new object[]
                        {
                            new
                            {
                                type = "body",
                                parameters = new object[]
                                {
                                    new { type = "text", text = patientName }
                                }
                            },
                            new
                            {
                                type = "button",
                                sub_type = "url",
                                index = "0", // changed to string to avoid potential json typing issues, or keep as int but use object[]
                                parameters = new object[]
                                {
                                    new { type = "text", text = link }
                                }
                            }
                        }
                    }
                };

                var request = new HttpRequestMessage(HttpMethod.Post, $"{_phoneNumberId}/messages");
                request.Headers.Add("Authorization", $"Bearer {_accessToken}");
                request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorResponse = await response.Content.ReadAsStringAsync();
                    _logger.LogError("WhatsApp API failed with status {StatusCode}: {ErrorResponse}", response.StatusCode, errorResponse);
                }
                else
                {
                    _logger.LogInformation("Successfully sent WhatsApp breast check reminder to {PhoneNumber}", formattedPhone);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while sending WhatsApp breast check reminder to {PhoneNumber}", phoneNumber);
            }
        }

        public async Task SendAppointmentCancellationAsync(string phoneNumber, string patientName, string date, string time, string language)
        {
            try
            {
                var formattedPhone = phoneNumber.StartsWith("+") ? phoneNumber.Substring(1) : phoneNumber;

                var payload = new
                {
                    messaging_product = "whatsapp",
                    to = formattedPhone,
                    type = "template",
                    template = new
                    {
                        name = "appointment_cancellation",
                        language = new { code = language },
                        components = new[]
                        {
                            new
                            {
                                type = "body",
                                parameters = new object[]
                                {
                                    new { type = "text", text = patientName },
                                    new { type = "text", text = date },
                                    new { type = "text", text = time }
                                }
                            }
                        }
                    }
                };

                var request = new HttpRequestMessage(HttpMethod.Post, $"{_phoneNumberId}/messages");
                request.Headers.Add("Authorization", $"Bearer {_accessToken}");
                request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorResponse = await response.Content.ReadAsStringAsync();
                    _logger.LogError("WhatsApp API failed with status {StatusCode}: {ErrorResponse}", response.StatusCode, errorResponse);
                }
                else
                {
                    _logger.LogInformation("Successfully sent WhatsApp appointment cancellation to {PhoneNumber}", formattedPhone);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while sending WhatsApp appointment cancellation to {PhoneNumber}", phoneNumber);
            }
        }
    }
}
