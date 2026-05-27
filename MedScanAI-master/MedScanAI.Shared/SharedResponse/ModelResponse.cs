namespace MedScanAI.Shared.SharedResponse
{
    public class ModelResponse
    {
        public string ClassLabelEn { get; set; } = null!;
        public string ClassLabelAr { get; set; } = null!;
        public string ConfidenceLevel { get; set; } = null!;
        public string GeneratedAdvice { get; set; } = null!;
    }
}
