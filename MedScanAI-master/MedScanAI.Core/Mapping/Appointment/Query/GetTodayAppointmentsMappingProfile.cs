using AutoMapper;

namespace MedScanAI.Core.Mapping.Appointment.Query
{
    public class GetTodayAppointmentsMappingProfile : Profile
    {
        public GetTodayAppointmentsMappingProfile()
        {
            CreateMap<Domain.Entities.Appointment, Shared.SharedResponse.GetTodayAppointmentsResponse>()
                .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient.FullName))
                .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => src.Doctor.FullName))
                .ForMember(dest => dest.Time, opt => opt.MapFrom(src => src.Date.ToString("HH:mm")));
        }
    }
}
