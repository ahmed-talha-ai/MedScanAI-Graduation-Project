using AutoMapper;
using MedScanAI.Core.Features.AppointmentFeature.Command.Model;

namespace MedScanAI.Core.Mapping.Appointment.Command
{
    public class BookAppointmentMappingProfile : Profile
    {
        public BookAppointmentMappingProfile()
        {
            CreateMap<BookAppointmentCommand, Domain.Entities.Appointment>();
            CreateMap<BookAppointmentByAdminCommand, Domain.Entities.Appointment>();
        }
    }
}
