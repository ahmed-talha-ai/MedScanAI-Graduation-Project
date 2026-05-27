using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Infrastructure.RepositoryBase;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Infrastructure.Repositories
{
    internal class AppointmentRepository : BaseRepository<Appointment>, IAppointmentRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly DbSet<Doctor> _doctors;
        private readonly DbSet<Appointment> _appointments;
        public AppointmentRepository(AppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
            _doctors = _dbContext.Set<Doctor>();
            _appointments = _dbContext.Set<Appointment>();
        }
        public async Task<ReturnBase<bool>> CancelAppointmentAsync(int appointmentId)
        {
            try
            {
                var appointment = await _appointments.Where(x => x.Id == appointmentId).FirstOrDefaultAsync();
                if (appointment is null)
                    return ReturnBaseHandler.Failed<bool>("Failed to retrieve appointment");

                appointment.Status = "Cancelled";

                _appointments.Update(appointment);

                await _dbContext.SaveChangesAsync();

                return ReturnBaseHandler.Success(true, "Appointment cancelled successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> CompleteAppointmentAsync(int appointmentId)
        {
            try
            {
                var appointment = await _appointments.Where(x => x.Id == appointmentId).FirstOrDefaultAsync();

                if (appointment is null)
                    return ReturnBaseHandler.Failed<bool>("Failed to retrieve appointment");

                appointment.Status = "Completed";

                _appointments.Update(appointment);
                await _dbContext.SaveChangesAsync();

                return ReturnBaseHandler.Success(true, "Appointment completed successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> ConfirmAppointmentAsync(int appointmentId)
        {
            try
            {
                var appointment = await _appointments.Where(x => x.Id == appointmentId).FirstOrDefaultAsync();

                if (appointment is null)
                    return ReturnBaseHandler.Failed<bool>("Failed to retrieve appointment");

                appointment.Status = "Confirmed";

                _appointments.Update(appointment);
                await _dbContext.SaveChangesAsync();

                return ReturnBaseHandler.Success(true, "Appointment confirmed successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<List<GetDoctorsForAppointmentsResponse>>> GetDoctorsForAppointmentsAsync(string? patientId)
        {
            try
            {
                var today = DateTime.Now.DayOfWeek.ToString().ToLower();
                var todayDate = DateTime.Today;
                var currentTime = DateTime.Now.TimeOfDay;

                Appointment? recentAppointment = null;

                if (!string.IsNullOrEmpty(patientId))
                {
                    recentAppointment = await _dbContext.Appointments
                        .Where(a => a.PatientId == patientId)
                        .OrderBy(a => a.Date)
                        .Where(a => a.Date.Date == todayDate)
                        .LastOrDefaultAsync();
                }

                // Get doctors the patient already has appointments with today (non-cancelled)
                var doctorsWithPatientAppointmentsToday = await _dbContext.Appointments
                    .Where(a => a.PatientId == patientId && a.Date.Date == todayDate && a.Status != "Cancelled")
                    .Select(a => a.DoctorId)
                    .Distinct()
                    .ToListAsync();

                List<Doctor> doctors;
                if (recentAppointment is null || recentAppointment.Status == "Cancelled")
                {
                    doctors = await _dbContext.Doctors
                                .Include(d => d.Specialization)
                                .Include(d => d.Schedules)
                                .Where(d => d.IsActive)
                                .Where(d => !doctorsWithPatientAppointmentsToday.Contains(d.Id))
                                .Where(d => d.Schedules.Any(s =>
                                    s.DayOfWeek == today &&
                                    s.IsAvailable &&
                                    s.StartTime <= currentTime &&
                                    s.EndTime >= currentTime))
                                .ToListAsync();
                }

                else
                {
                    doctors = await _dbContext.Doctors
                                .Include(d => d.Specialization)
                                .Include(d => d.Schedules)
                                .Where(d => d.IsActive)
                                .Where(d => d.Id != recentAppointment.DoctorId) // Exclude last doctor
                                .Where(d => !doctorsWithPatientAppointmentsToday.Contains(d.Id))
                                .Where(d => d.Schedules.Any(s =>
                                    s.DayOfWeek == today &&
                                    s.IsAvailable &&
                                    s.StartTime <= currentTime &&
                                    s.EndTime >= currentTime))
                                .ToListAsync();
                }

                // Get patient's appointments for today (excluding cancelled)
                var patientAppointmentsToday = await _dbContext.Appointments
                    .Where(a => a.PatientId == patientId && a.Date.Date == todayDate && a.Status != "Cancelled")
                    .OrderBy(a => a.Date)
                    .ToListAsync();

                var doctorResponses = new List<GetDoctorsForAppointmentsResponse>();

                foreach (var doctor in doctors)
                {
                    // Get the doctor's schedule for today
                    var schedule = doctor.Schedules.FirstOrDefault(s => s.DayOfWeek == today && s.IsAvailable);
                    if (schedule == null) continue;

                    // Get all non-cancelled appointments for today for this doctor
                    var todaysAppointments = await _dbContext.Appointments
                        .Where(a => a.DoctorId == doctor.Id && a.Date.Date == todayDate && a.Status != "Cancelled")
                        .OrderBy(a => a.Date)
                        .ToListAsync();

                    // Generate available start times from current time till end of schedule
                    var availableTimes = new List<string>();
                    var slotLength = TimeSpan.FromMinutes(30); // you can make this configurable
                    var nextAvailable = currentTime < schedule.StartTime ? schedule.StartTime : currentTime;

                    while (nextAvailable.Add(slotLength) <= schedule.EndTime)
                    {
                        // Check if doctor slot is booked (only active appointments)
                        bool isDoctorSlotBooked = todaysAppointments.Any(a =>
                            a.Date.TimeOfDay == nextAvailable ||
                            (a.Date.TimeOfDay < nextAvailable.Add(slotLength) && a.Date.TimeOfDay > nextAvailable)
                        );

                        // Check if patient has a conflicting appointment at this time (only active appointments)
                        bool isPatientBusy = patientAppointmentsToday.Any(a =>
                            a.Date.TimeOfDay == nextAvailable ||
                            (a.Date.TimeOfDay < nextAvailable.Add(slotLength) && a.Date.TimeOfDay > nextAvailable)
                        );

                        if (!isDoctorSlotBooked && !isPatientBusy)
                        {
                            // Convert to 12-hour format with AM/PM for Egypt
                            availableTimes.Add(DateTime.Today
                                .Add(nextAvailable)
                                .ToString("hh:mm tt", new System.Globalization.CultureInfo("en-EG")));
                        }

                        nextAvailable = nextAvailable.Add(slotLength);
                    }

                    doctorResponses.Add(new GetDoctorsForAppointmentsResponse
                    {
                        Id = doctor.Id,
                        FullName = doctor.FullName,
                        Specialization = doctor.Specialization?.Name,
                        YearsOfExperience = doctor.YearsOfExperience,
                        AvailableStartTimes = availableTimes
                    });
                }

                return ReturnBaseHandler.Success(doctorResponses);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<GetDoctorsForAppointmentsResponse>>(
                    ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<List<Appointment>>> GetPatientAppointmentsAsync(string patientId)
        {
            try
            {
                var appointments = await _appointments.Where(x => x.PatientId == patientId).ToListAsync();

                if (appointments is null)
                    return ReturnBaseHandler.Failed<List<Appointment>>("Failed to retreive patients appointments");

                return ReturnBaseHandler.Success(appointments);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<Appointment>>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<List<GetTodayAppointmentsResponse>>> GetTodayAppointmentsAsync()
        {
            try
            {
                var today = DateTime.Today;

                var todayAppointments = await _dbContext.Appointments
                    .Include(a => a.Doctor)
                    .Include(a => a.Patient)
                    .Where(a => a.Date.Date == today)
                    .Where(a => a.Status != "Cancelled")
                    .Select(a => new GetTodayAppointmentsResponse
                    {
                        Id = a.Id,
                        Time = a.Date.ToString("hh:mm tt", new System.Globalization.CultureInfo("en-EG")),
                        DoctorName = a.Doctor != null ? a.Doctor.FullName : "غير محدد",
                        PatientName = a.Patient != null
                                    ? a.Patient.FullName
                                    : (string.IsNullOrEmpty(a.PatientName) ? "زائر" : a.PatientName),
                        Status = a.Status
                    })
                    .ToListAsync();

                return ReturnBaseHandler.Success(todayAppointments);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<GetTodayAppointmentsResponse>>(
                    ex.InnerException?.Message ?? ex.Message
                );
            }
        }
    }
}