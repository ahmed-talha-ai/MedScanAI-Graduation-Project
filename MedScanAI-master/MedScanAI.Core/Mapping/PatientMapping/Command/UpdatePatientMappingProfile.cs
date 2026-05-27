using AutoMapper;
using MedScanAI.Core.Features.PatientFeature.Command.Model;
using MedScanAI.Domain.Entities;

namespace MedScanAI.Core.Mapping.PatientMapping.Command
{
    public class UpdatePatientMappingProfile : Profile
    {
        public UpdatePatientMappingProfile()
        {
            CreateMap<UpdatePatientProfileCommand, Patient>()
                .ForMember(dest => dest.FamilyHistories, opt => opt.Ignore())
                .ForMember(dest => dest.ChronicDiseases, opt => opt.Ignore())
                .ForMember(dest => dest.Allergies, opt => opt.Ignore())
                .ForMember(dest => dest.CurrentMedications, opt => opt.Ignore());
        }
    }
}
