namespace MedScanAI.Shared.SharedResponse
{
    public class GetPatientProfileResponse
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Gender { get; set; }
        public DateOnly DateOfBirth { get; set; }
        public List<PatientHistoryResponse> ChronicDiseases { get; set; }
        public List<PatientHistoryResponse> Allergies { get; set; }
        public List<PatientHistoryResponse> CurrentMedication { get; set; }
        public string? BloodType { get; set; }
        public List<PatientHistoryResponse>? FamilyHistory { get; set; }
    }
    public class PatientHistoryResponse
    {
        public string PatientId { get; set; }
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
