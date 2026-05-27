using AutoMapper;
using MedScanAI.Core.Features.Authentication.Command.Model;

namespace MedScanAI.Core.Mapping.Authentication.Command
{
    public class RegsiterDoctorCommandMappingProfile : Profile
    {
        public RegsiterDoctorCommandMappingProfile()
        {
            CreateMap<RegisterDoctorCommand, Domain.Entities.Doctor>();
        }
    }
}
