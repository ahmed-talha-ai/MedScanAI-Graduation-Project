using AutoMapper;
using MedScanAI.Core.Features.Doctor.Query.Response;

namespace MedScanAI.Core.Mapping.Doctor.Query
{
    public class GetAllActiveDoctorsMappingProfile : Profile
    {
        public GetAllActiveDoctorsMappingProfile()
        {
            CreateMap<Domain.Entities.Doctor, GetAllActiveDoctorsResponse>();
        }
    }
}
