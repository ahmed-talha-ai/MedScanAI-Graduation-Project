namespace MedScanAI.Shared.SharedResponse
{
    public class GetPatientAppointmentsResponse
    {
        public int AppointmentId { get; set; }
        public string? PatientName { get; set; }
        public DateTime Date { get; set; }
        public string Status { get; set; }
        public string Reason { get; set; }
    }
}
