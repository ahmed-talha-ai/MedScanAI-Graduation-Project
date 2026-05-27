using AutoMapper;
using MedScanAI.Domain.Entities;
using MedScanAI.Shared.SharedRequest;

namespace MedScanAI.Core.Mapping.CurrentMedicationMapping.Command
{
    public class UpdateCurrentMedicationMappingProfile : Profile
    {
        public UpdateCurrentMedicationMappingProfile()
        {
            CreateMap<PatientUpdateProfileSharedRequest, PatientCurrentMedication>();
        }
    }
}
