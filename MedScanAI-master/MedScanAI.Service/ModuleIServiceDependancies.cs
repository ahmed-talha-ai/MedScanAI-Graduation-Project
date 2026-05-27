using MedScanAI.Service.Abstracts;
using MedScanAI.Service.Implementation;
using Microsoft.Extensions.DependencyInjection;

namespace MedScanAI.Service
{
    public static class ModuleIServiceDependancies
    {
        public static IServiceCollection AddServiceDependencies(this IServiceCollection services)
        {
            services.AddTransient<IAuthenticationService, AuthenticationService>();
            services.AddTransient<ISendEmailService, SendEmailService>();
            services.AddTransient<IConfirmEmailService, ConfirmEmailService>();
            services.AddTransient<IDoctorService, DoctorService>();
            services.AddTransient<IPatientProfileService, PatientProfileService>();
            services.AddTransient<IAppointmentService, AppointmentService>();
            services.AddTransient<IChronicDiseaseService, ChronicDiseaseService>();
            services.AddTransient<IAllergyService, AllergyService>();
            services.AddTransient<ICurrentMedicationService, CurrentMedicationService>();
            services.AddTransient<IPatientService, PatientService>();
            services.AddTransient<IAIService, AIService>();
            services.AddTransient<IDoctorExtraService, DoctorExtraService>();
            services.AddTransient<IReviewService, ReviewService>();
            services.AddTransient<IPatientPreferencesService, PatientPreferencesService>();

            return services;
        }
    }
}
