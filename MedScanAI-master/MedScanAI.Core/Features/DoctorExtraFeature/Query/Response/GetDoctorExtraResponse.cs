namespace MedScanAI.Core.Features.DoctorExtraFeature.Query.Response
{
    public class GetDoctorExtraResponse
    {
        public string? Bio { get; set; }
        public string? ClinicAddress { get; set; }
        public decimal? ConsultationFee { get; set; }
        public string? Governorate { get; set; }
        public string? PhotoBase64 { get; set; }
    }
}
