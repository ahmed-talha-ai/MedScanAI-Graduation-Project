using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.Doctor.Query.Model
{
    public class GetAllDoctorsCountQuery : IRequest<ReturnBase<int>>
    {
    }
}
