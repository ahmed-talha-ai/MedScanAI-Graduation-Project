using MediatR;
using MedScanAI.Core.Features.Doctor.Query.Response;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.Doctor.Query.Model
{
    public class GetAllDoctorsQuery : IRequest<ReturnBase<IQueryable<GetAllDoctorsResponse>>>
    {
    }
}
