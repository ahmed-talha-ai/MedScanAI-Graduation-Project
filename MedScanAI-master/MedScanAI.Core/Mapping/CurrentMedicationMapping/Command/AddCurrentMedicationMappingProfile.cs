using AutoMapper;
using MedScanAI.Core.Features.CurrentMedicationFeature.Command.Model;
using MedScanAI.Domain.Entities;

namespace MedScanAI.Core.Mapping.CurrentMedicationMapping.Command
{
    public class AddCurrentMedicationMappingProfile : Profile
    {
        public AddCurrentMedicationMappingProfile()
        {
            CreateMap<AddCurrentMedicationCommand, PatientCurrentMedication>();
        }
    }
}
