namespace MedScanAI.Shared.SharedResponse
{
    public class LabModelResponse
    {
        public string Status { get; set; }
        public string Analysis { get; set; }
        public string ImagePath { get; set; }
        public DateTime TimeStamp { get; set; }
        public bool Cached { get; set; }
    }
}
