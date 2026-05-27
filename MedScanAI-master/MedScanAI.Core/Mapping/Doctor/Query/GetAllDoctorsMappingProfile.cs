using AutoMapper;
using MedScanAI.Core.Features.Doctor.Query.Response;

namespace MedScanAI.Core.Mapping.Doctor.Query
{
    public class GetAllDoctorsMappingProfile : Profile
    {
        public GetAllDoctorsMappingProfile()
        {
            CreateMap<Domain.Entities.Doctor, GetAllDoctorsResponse>();
        }
    }
}
