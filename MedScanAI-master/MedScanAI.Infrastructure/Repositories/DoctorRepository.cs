using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Infrastructure.RepositoryBase;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Infrastructure.Repositories
{
    internal class DoctorRepository : BaseRepository<Doctor>, IDoctorRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly DbSet<Doctor> _doctors;
        private readonly DbSet<Appointment> _appointments;
        private readonly DbSet<AIReport> _aiReports;
        public DoctorRepository(AppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
            _doctors = _dbContext.Set<Doctor>();
            _appointments = _dbContext.Set<Appointment>();
            _aiReports = _dbContext.Set<AIReport>();
        }

        public ReturnBase<IQueryable<Doctor>> GetActiveDoctors()
        {
            try
            {
                var activeDoctors = _doctors.Where(d => d.IsActive);

                if (activeDoctors is null)
                    return ReturnBaseHandler.Failed<IQueryable<Doctor>>("No active doctors found");

                return ReturnBaseHandler.Success(activeDoctors);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<IQueryable<Doctor>>(
                    ex.InnerException?.Message ?? ex.Message
                );
            }
        }

        public async Task<ReturnBase<int>> GetActiveDoctorsCountAsync()
        {
            try
            {
                int count = await _doctors.Where(x => x.IsActive == true).CountAsync();
                return ReturnBaseHandler.Success(count);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<int>(
                    ex.InnerException?.Message ?? ex.Message
                );
            }
        }
        public async Task<ReturnBase<int>> GetAllDoctorsCountAsync()
        {
            try
            {
                int count = await _doctors.CountAsync();
                return ReturnBaseHandler.Success(count);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<int>(
                    ex.InnerException?.Message ?? ex.Message
                );
            }
        }
        public async Task<ReturnBase<GetDoctorAppointmentsAndDoctorInfoResponse>> GetDoctorAppointmentsAndDoctorInfoAsync(string doctorId)
        {
            try
            {
                var doctor = await _doctors.FirstOrDefaultAsync(x => x.Id == doctorId);
                if (doctor == null)
                    return ReturnBaseHandler.Failed<GetDoctorAppointmentsAndDoctorInfoResponse>("Doctor not found");

                var today = DateTime.Today;
                var culture = new System.Globalization.CultureInfo("en-EG");

                var appointments = await _appointments
                    .Include(x => x.Patient)
                    .Include(x => x.Patient.Allergies)
                    .Include(x => x.Patient.ChronicDiseases)
                    .Include(x => x.Patient.CurrentMedications)
                    .Where(a => a.DoctorId == doctorId && a.Date.Date == today && a.Status != "Completed" && a.Status != "Cancelled" && a.Status == "Confirmed")
                    .ToListAsync();

                var patientResponse = appointments.Select(a => new PatientResponse
                {
                    AppointmentId = a.Id,
                    PatientId = a.PatientId,
                    AppointmentDate = a.Date.ToString("hh:mm tt", culture),
                    Reason = a.Reason,
                    PatientName = a.PatientName,
                    ChronicDiseases = a.Patient?.ChronicDiseases?.Select(x => x.Name).ToList() ?? new List<string>(),
                    Allergies = a.Patient?.Allergies?.Select(x => x.Name).ToList() ?? new List<string>(),
                    CurrentMedicine = a.Patient?.CurrentMedications?.Select(x => x.Name).ToList() ?? new List<string>(),
                    MedicalReport = _aiReports.Where(r => r.PatientId == a.PatientId).Select(r => r.Report).FirstOrDefault() ?? "No medical report available"
                }).ToList();

                var response = new GetDoctorAppointmentsAndDoctorInfoResponse
                {
                    DoctorId = doctor.Id,
                    DoctorName = doctor.FullName,
                    Patients = patientResponse
                };

                return ReturnBaseHandler.Success(response);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<GetDoctorAppointmentsAndDoctorInfoResponse>(
                    ex.InnerException?.Message ?? ex.Message
                );
            }
        }
        public async Task<ReturnBase<Doctor>> GetDoctorAsync(string doctorId)
        {
            try
            {
                var doctor = await _doctors.FirstOrDefaultAsync(x => x.Id == doctorId);

                if (doctor is null)
                    return ReturnBaseHandler.Failed<Doctor>("Doctor not found");
                return ReturnBaseHandler.Success(doctor);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<Doctor>(
                    ex.InnerException?.Message ?? ex.Message
                );
            }
        }
    }
}