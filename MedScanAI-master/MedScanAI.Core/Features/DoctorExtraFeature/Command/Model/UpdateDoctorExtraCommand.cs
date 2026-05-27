using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.DoctorExtraFeature.Command.Model
{
    public class UpdateDoctorExtraCommand : IRequest<ReturnBase<bool>>
    {
        public string DoctorId { get; set; }
        public string? Bio { get; set; }
        public string? ClinicAddress { get; set; }
        public decimal? ConsultationFee { get; set; }
        public string? Governorate { get; set; }
        public string? PhotoBase64 { get; set; }
    }
}
