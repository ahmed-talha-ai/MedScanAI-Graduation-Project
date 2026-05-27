using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.DoctorExtraFeature.Command.Model
{
    public class SubmitDoctorReviewCommand : IRequest<ReturnBase<bool>>
    {
        public string DoctorId { get; set; }
        public string PatientId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}
