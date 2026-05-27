namespace MedScanAI.Shared.SharedResponse
{
    public class GetTodayAppointmentsResponse
    {
        public int Id { get; set; }
        public string PatientName { get; set; }
        public string DoctorName { get; set; }
        public string Time { get; set; }
        public string Status { get; set; }
    }
}
