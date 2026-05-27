using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace MedScanAI.Infrastructure
{
    public static class ModuleInfrastructureDependancies
    {
        public static IServiceCollection AddInfrastructureDependencies(this IServiceCollection services)
        {
            services.AddTransient<IDoctorRepository, DoctorRepository>();
            services.AddTransient<IPatientAllergiesRepository, PatientAllergiesRepository>();
            services.AddTransient<ICurrentMedicationRepository, CurrentMedicationRepository>();
            services.AddTransient<IChronicDiseasesRepository, ChronicDiseasesRepository>();
            services.AddTransient<IPatientFamilyHistoryRepository, PatientFamilyHistoryRepository>();
            services.AddTransient<IPatientRepository, PatientRepository>();
            services.AddTransient<IDoctorScheduleRepository, DoctorScheduleRepository>();
            services.AddTransient<IAppointmentRepository, AppointmentRepository>();
            services.AddTransient<IAIReportRepository, AIReportRepository>();

            return services;
        }
    }
}
