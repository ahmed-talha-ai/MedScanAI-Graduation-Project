namespace MedScanAI.Core.Features.Doctor.Query.Response
{
    public class GetAllDoctorsResponse
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
    }
}
