namespace MedScanAI.Core.Features.DoctorExtraFeature.Query.Response
{
    public class GetDoctorReviewsResponse
    {
        public int Id { get; set; }
        public string PatientName { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
