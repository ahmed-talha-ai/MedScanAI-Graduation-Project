using AutoMapper;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Core.Mapping.Appointment.Query
{
    public class GetPatientAppointmentsMappingProfile : Profile
    {
        public GetPatientAppointmentsMappingProfile()
        {
            CreateMap<Domain.Entities.Appointment, GetPatientAppointmentsResponse>()
                .ForMember(dest => dest.AppointmentId, opt => opt.MapFrom(src => src.Id));
        }
    }
}
