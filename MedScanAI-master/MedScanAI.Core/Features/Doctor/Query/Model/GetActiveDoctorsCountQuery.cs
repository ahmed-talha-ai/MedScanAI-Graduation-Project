using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.Doctor.Query.Model
{
    public class GetActiveDoctorsCountQuery : IRequest<ReturnBase<int>>
    {
    }
}
