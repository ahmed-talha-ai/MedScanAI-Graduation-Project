using AutoMapper;
using MedScanAI.Core.Features.Authentication.Command.Model;
using MedScanAI.Domain.Entities;

namespace MedScanAI.Core.Mapping.Authentication.Command
{
    public class RegsiterPatientCommandMappingProfile : Profile
    {
        public RegsiterPatientCommandMappingProfile()
        {
            CreateMap<RegisterPatientCommand, Patient>()
                .ForMember(dest => dest.FamilyHistories, opt => opt.Ignore())
                .ForMember(dest => dest.Allergies, opt => opt.Ignore())
                .ForMember(dest => dest.CurrentMedications, opt => opt.Ignore())
                .ForMember(dest => dest.ChronicDiseases, opt => opt.Ignore());
        }
    }
}
