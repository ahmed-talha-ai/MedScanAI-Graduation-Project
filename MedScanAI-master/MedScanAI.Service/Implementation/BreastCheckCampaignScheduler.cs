using MedScanAI.Infrastructure.Context;
using MedScanAI.Service.Abstracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MedScanAI.Service.Implementation
{
    public class BreastCheckCampaignScheduler : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BreastCheckCampaignScheduler> _logger;

        public BreastCheckCampaignScheduler(IServiceProvider serviceProvider, ILogger<BreastCheckCampaignScheduler> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.UtcNow;
                var nextRun = new DateTime(now.Year, now.Month, now.Day, 9, 0, 0, DateTimeKind.Utc);
                
                if (now > nextRun)
                {
                    nextRun = nextRun.AddDays(1);
                }

                var delay = nextRun - now;
                _logger.LogInformation("BreastCheckCampaignScheduler next run at {NextRun} (in {DelayHours} hours).", nextRun, delay.TotalHours);

                // Wait until the next run time
                await Task.Delay(delay, stoppingToken);

                if (stoppingToken.IsCancellationRequested) break;

                await RunCampaignAsync(stoppingToken);
            }
        }

        private async Task RunCampaignAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Starting Breast Check Campaign...");

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var whatsAppService = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();

                // Get all female patients with a phone number who have campaigns enabled
                var targetPatients = await dbContext.Patients
                    .Where(p => p.Gender == "Female" && p.PhoneNumber != null && p.IsCampaignNotificationEnabled)
                    .Select(p => new { p.FullName, p.PhoneNumber, p.PreferredLanguage })
                    .ToListAsync(stoppingToken);

                _logger.LogInformation("Found {Count} patients to notify for breast check campaign.", targetPatients.Count);

                int successCount = 0;
                int failureCount = 0;

                foreach (var patient in targetPatients)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    try
                    {
                        var link = "https://mediscanai.com/self-exam/breast"; // URL placeholder
                        await whatsAppService.SendBreastCheckReminderAsync(
                            patient.PhoneNumber!,
                            patient.FullName,
                            link,
                            patient.PreferredLanguage);
                        successCount++;
                    }
                    catch (Exception ex)
                    {
                        failureCount++;
                        _logger.LogError(ex, "Failed to send breast check reminder to {PhoneNumber}", patient.PhoneNumber);
                    }
                }

                _logger.LogInformation("Breast Check Campaign completed. Success: {SuccessCount}, Failures: {FailureCount}", successCount, failureCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while running the breast check campaign.");
            }
        }
    }
}
