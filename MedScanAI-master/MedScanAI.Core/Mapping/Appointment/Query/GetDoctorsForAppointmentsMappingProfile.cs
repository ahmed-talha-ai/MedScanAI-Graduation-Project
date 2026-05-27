using AutoMapper;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Core.Mapping.Appointment.Query
{
    public class GetDoctorsForAppointmentsMappingProfile : Profile
    {
        public GetDoctorsForAppointmentsMappingProfile()
        {
            CreateMap<Domain.Entities.Doctor, GetDoctorsForAppointmentsResponse>()
                .ForMember(dest => dest.Specialization, opt => opt.MapFrom(src => src.Specialization.Name));
        }
    }
}
