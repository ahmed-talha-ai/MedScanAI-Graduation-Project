namespace MedScanAI.Shared.SharedResponse
{
    public class GetDoctorAppointmentsAndDoctorInfoResponse
    {
        public string DoctorId { get; set; }
        public string DoctorName { get; set; }
        public List<PatientResponse> Patients { get; set; }
    }
    public class PatientResponse
    {
        public int AppointmentId { get; set; }
        public string PatientId { get; set; }
        public string PatientName { get; set; }
        public string Reason { get; set; }
        public List<string> ChronicDiseases { get; set; }
        public List<string> Allergies { get; set; }
        public List<string> CurrentMedicine { get; set; }
        public string AppointmentDate { get; set; }
        public string MedicalReport { get; set; }
    }
}
