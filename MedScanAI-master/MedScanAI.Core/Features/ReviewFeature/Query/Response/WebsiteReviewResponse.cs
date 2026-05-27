namespace MedScanAI.Core.Features.ReviewFeature.Query.Response
{
    public class WebsiteReviewResponse
    {
        public int Id { get; set; }
        public string PatientId { get; set; }
        public string FirstName { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
