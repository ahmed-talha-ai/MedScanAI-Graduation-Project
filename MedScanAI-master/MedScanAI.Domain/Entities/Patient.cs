using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedScanAI.Domain.Entities
{
    [Table("Patients")]
    public class Patient
    {
        [Key]
        [ForeignKey("ApplicationUser")]
        public string Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string FullName { get; set; }

        [Required]
        [MaxLength(200)]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MaxLength(20)]
        [Phone]
        public string PhoneNumber { get; set; }

        [Required]
        [MaxLength(10)]
        public string Gender { get; set; }

        [Required]
        public DateOnly DateOfBirth { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ApplicationUser ApplicationUser { get; set; }
        public AIReport AIReport { get; set; }

        [MaxLength(5)]
        public string? BloodType { get; set; }

        public bool IsAppointmentNotificationEnabled { get; set; } = true;
        public bool IsCampaignNotificationEnabled { get; set; } = true;

        [MaxLength(5)]
        public string PreferredLanguage { get; set; } = "ar";

        public ICollection<PatientFamilyHistory> FamilyHistories { get; set; } = new List<PatientFamilyHistory>();

        public ICollection<PatientAllergy> Allergies { get; set; } = new List<PatientAllergy>();
        public ICollection<PatientChronicDisease> ChronicDiseases { get; set; } = new List<PatientChronicDisease>();
        public ICollection<PatientCurrentMedication> CurrentMedications { get; set; } = new List<PatientCurrentMedication>();
        public ICollection<AIChatSession> ChatSessions { get; set; } = new List<AIChatSession>();
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public WebsiteReview? WebsiteReview { get; set; }
        public ICollection<DoctorReview> DoctorReviews { get; set; } = new List<DoctorReview>();
        public ICollection<ChildProfile> ChildProfiles { get; set; } = new List<ChildProfile>();
    }
}
