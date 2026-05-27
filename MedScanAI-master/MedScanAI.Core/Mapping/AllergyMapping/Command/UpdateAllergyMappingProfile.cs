using AutoMapper;
using MedScanAI.Domain.Entities;
using MedScanAI.Shared.SharedRequest;

namespace MedScanAI.Core.Mapping.AllergyMapping.Command
{
    public class UpdateAllergyMappingProfile : Profile
    {
        public UpdateAllergyMappingProfile()
        {
            CreateMap<PatientUpdateProfileSharedRequest, PatientAllergy>();
        }
    }
}
