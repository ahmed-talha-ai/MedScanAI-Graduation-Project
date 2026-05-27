using AutoMapper;
using MedScanAI.Core.Features.AllergyFeature.Command.Model;
using MedScanAI.Domain.Entities;

namespace MedScanAI.Core.Mapping.AllergyMapping.Command
{
    public class AddAllergyMappingProfile : Profile
    {
        public AddAllergyMappingProfile()
        {
            CreateMap<AddAllergyCommand, PatientAllergy>();
        }
    }
}
