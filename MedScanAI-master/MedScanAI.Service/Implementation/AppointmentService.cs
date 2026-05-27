using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.Hubs;
using MedScanAI.Shared.SharedResponse;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Service.Implementation
{
    internal class AppointmentService : IAppointmentService
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IHubContext<AppointmentHub> _hubContext;
        private readonly IWhatsAppService _whatsAppService;

        public AppointmentService(
            IAppointmentRepository appointmentRepository,
            IPatientRepository patientRepository,
            IHubContext<AppointmentHub> hubContext,
            IWhatsAppService whatsAppService)
        {
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
            _hubContext = hubContext;
            _whatsAppService = whatsAppService;
        }

        public async Task<ReturnBase<bool>> CancelAppointmentAsync(int appointmentId)
        {
            try
            {
                var appointmentResult = await _appointmentRepository.GetByIdAsync(appointmentId);

                if (!appointmentResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(appointmentResult.Message);

                if (appointmentResult.Data!.Status == "Completed" || appointmentResult.Data!.Status == "Cancelled")
                    return ReturnBaseHandler.Failed<bool>("Cannot cancel a completed or already cancelled appointment.");

                var cancelAppointmentResult = await _appointmentRepository.CancelAppointmentAsync(appointmentId);

                if (!cancelAppointmentResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(cancelAppointmentResult.Message);

                // Fire SignalR event for appointment cancellation
                await _hubContext.Clients.All.SendAsync("AppointmentCancelled", new
                {
                    AppointmentId = appointmentId,
                    PatientId = appointmentResult.Data.PatientId,
                    DoctorId = appointmentResult.Data.DoctorId,
                    AppointmentDate = appointmentResult.Data.Date,
                    Message = "Appointment has been cancelled"
                });

                // Fire WhatsApp Notification if applicable
                if (appointmentResult.Data.Patient is not null && 
                    appointmentResult.Data.Patient.PhoneNumber is not null && 
                    appointmentResult.Data.Patient.IsAppointmentNotificationEnabled)
                {
                    var dateStr = appointmentResult.Data.Date.ToShortDateString();
                    var timeStr = appointmentResult.Data.Date.ToShortTimeString();
                    
                    _ = _whatsAppService.SendAppointmentCancellationAsync(
                        appointmentResult.Data.Patient.PhoneNumber, 
                        appointmentResult.Data.Patient.FullName, 
                        dateStr, 
                        timeStr, 
                        appointmentResult.Data.Patient.PreferredLanguage);
                }

                return ReturnBaseHandler.Success(cancelAppointmentResult.Data, cancelAppointmentResult.Message);
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
                if (appointmentId <= 0)
                    return ReturnBaseHandler.Failed<bool>("Invalid appointment ID.");

                var completeppointmentResult = await _appointmentRepository.CompleteAppointmentAsync(appointmentId);

                if (!completeppointmentResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(completeppointmentResult.Message);

                return ReturnBaseHandler.Success(completeppointmentResult.Data, completeppointmentResult.Message);
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
                if (appointmentId <= 0)
                    return ReturnBaseHandler.Failed<bool>("Invalid appointment ID.");

                var confirmAppointmentResult = await _appointmentRepository.ConfirmAppointmentAsync(appointmentId);

                if (!confirmAppointmentResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(confirmAppointmentResult.Message);

                // Fire SignalR event for appointment cancellation
                await _hubContext.Clients.All.SendAsync("AppointmentConfirmed", new
                {
                    AppointmentId = appointmentId,
                    Message = "Appointment has been confirmed"
                });

                return ReturnBaseHandler.Success(confirmAppointmentResult.Data, confirmAppointmentResult.Message);
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
                var doctors = await _appointmentRepository.GetDoctorsForAppointmentsAsync(patientId);
                return ReturnBaseHandler.Success(doctors.Data!);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<GetDoctorsForAppointmentsResponse>>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<List<Appointment>>> GetPatientAppointmentsAsync(string patientId)
        {
            try
            {
                var appointmentsResult = await _appointmentRepository.GetPatientAppointmentsAsync(patientId);

                if (!appointmentsResult.Succeeded)
                    return ReturnBaseHandler.Failed<List<Appointment>>(appointmentsResult.Message);

                return ReturnBaseHandler.Success(appointmentsResult.Data!);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<Appointment>>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<List<GetTodayAppointmentsResponse>>> GetTodaysAppointmentsAsync()
        {
            try
            {
                var doctors = await _appointmentRepository.GetTodayAppointmentsAsync();
                return ReturnBaseHandler.Success(doctors.Data!);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<GetTodayAppointmentsResponse>>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> BookAppointmentAsync(Appointment appointment)
        {
            try
            {
                Patient? patient = null;
                if (appointment.PatientId is not null)
                {
                    // Get the patient name and store it the appointment
                    patient = await _patientRepository.GetTableNoTracking()
                        .Data!.Where(x => x.Id == appointment.PatientId).FirstOrDefaultAsync();

                    appointment.PatientName = patient?.FullName;
                }

                var makeAppointmentResult = await _appointmentRepository.AddAsync(appointment);

                if (!makeAppointmentResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(makeAppointmentResult.Message);

                // Fire SignalR event for new appointment creation
                await _hubContext.Clients.All.SendAsync("AppointmentCreated", new
                {
                    AppointmentId = appointment.Id,
                    PatientId = appointment.PatientId,
                    PatientName = appointment.PatientName,
                    DoctorId = appointment.DoctorId,
                    AppointmentDate = appointment.Date,
                    Reason = appointment.Reason,
                    Status = appointment.Status,
                    Message = "New appointment has been created"
                });

                // Fire WhatsApp Notification
                if (patient is not null && patient.PhoneNumber is not null && patient.IsAppointmentNotificationEnabled)
                {
                    var dateStr = appointment.Date.ToShortDateString();
                    var timeStr = appointment.Date.ToShortTimeString();
                    _ = _whatsAppService.SendAppointmentReminderAsync(patient.PhoneNumber, patient.FullName, dateStr, timeStr, patient.PreferredLanguage);
                }

                return ReturnBaseHandler.Success(true, "Appointment made successfully.");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> BookAppointmentByAdminAsync(Appointment appointment)
        {
            try
            {
                Patient? patient = null;
                if (appointment.PatientId is not null)
                {
                    // Get the patient name and store it the appointment
                    patient = await _patientRepository.GetTableNoTracking()
                        .Data!.Where(x => x.Id == appointment.PatientId).FirstOrDefaultAsync();

                    appointment.PatientName = patient?.FullName;
                }

                var makeAppointmentResult = await _appointmentRepository.AddAsync(appointment);

                if (!makeAppointmentResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(makeAppointmentResult.Message);

                // Fire SignalR event for new appointment creation
                await _hubContext.Clients.All.SendAsync("AppointmentCreated", new
                {
                    AppointmentId = appointment.Id,
                    PatientId = appointment.PatientId,
                    PatientName = appointment.PatientName,
                    DoctorId = appointment.DoctorId,
                    AppointmentDate = appointment.Date,
                    Reason = appointment.Reason,
                    Status = appointment.Status,
                    Message = "New appointment has been created by admin"
                });

                // Fire WhatsApp Notification
                if (patient is not null && patient.PhoneNumber is not null && patient.IsAppointmentNotificationEnabled)
                {
                    var dateStr = appointment.Date.ToShortDateString();
                    var timeStr = appointment.Date.ToShortTimeString();
                    _ = _whatsAppService.SendAppointmentReminderAsync(patient.PhoneNumber, patient.FullName, dateStr, timeStr, patient.PreferredLanguage);
                }

                return ReturnBaseHandler.Success(true, "Appointment made successfully by admin.");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
