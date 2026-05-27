using AutoMapper;
using MedScanAI.Domain.Entities;
using MedScanAI.Shared.SharedRequest;

namespace MedScanAI.Core.Mapping.ChronicDiseaseMapping.Command
{
    public class UpdateChronicDiseaseMappingProfile : Profile
    {
        public UpdateChronicDiseaseMappingProfile()
        {
            CreateMap<PatientUpdateProfileSharedRequest, PatientChronicDisease>();
        }
    }
}
