namespace MedScanAI.Shared.SharedResponse
{
    public class GetDoctorsForAppointmentsResponse
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string Specialization { get; set; }
        public int YearsOfExperience { get; set; }
        public List<string> AvailableStartTimes { get; set; }
    }
}