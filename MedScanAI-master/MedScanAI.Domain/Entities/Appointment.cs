using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedScanAI.Domain.Entities
{
    [Table("Appointments")]
    public class Appointment
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Patient")]
        public string? PatientId { get; set; }
        public string? PatientName { get; set; } // For Guest Patients

        [Required]
        [ForeignKey("Doctor")]
        public string DoctorId { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [MaxLength(500)]
        public string Reason { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Confirmed";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Patient Patient { get; set; }
        public Doctor Doctor { get; set; }
        public AIReport AIReport { get; set; }
    }
}
