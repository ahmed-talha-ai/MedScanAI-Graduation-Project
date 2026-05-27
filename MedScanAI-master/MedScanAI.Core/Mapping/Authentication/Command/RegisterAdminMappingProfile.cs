using AutoMapper;
using MedScanAI.Core.Features.Authentication.Command.Model;
using MedScanAI.Domain.Entities;

namespace MedScanAI.Core.Mapping.Authentication.Command
{
    public class RegisterAdminMappingProfile : Profile
    {
        public RegisterAdminMappingProfile()
        {
            CreateMap<RegisterAdminCommand, ApplicationUser>();
        }
    }
}