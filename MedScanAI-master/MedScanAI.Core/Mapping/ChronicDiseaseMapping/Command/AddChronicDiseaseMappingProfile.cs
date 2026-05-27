using AutoMapper;
using MedScanAI.Core.Features.ChronicDiseaseFeature.Command.Model;
using MedScanAI.Domain.Entities;

namespace MedScanAI.Core.Mapping.ChronicDiseaseMapping.Command
{
    public class AddChronicDiseaseMappingProfile : Profile
    {
        public AddChronicDiseaseMappingProfile()
        {
            CreateMap<AddChronicDiseaseCommand, PatientChronicDisease>();
        }
    }
}
