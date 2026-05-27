namespace MedScanAI.Shared.SharedResponse
{
    public class ChatbotResponse
    {
        public string Status { get; set; }
        public string SessionId { get; set; }
        public string Response { get; set; }
        public DateTime TimeStamp { get; set; }
        public bool Cached { get; set; }
    }
}
