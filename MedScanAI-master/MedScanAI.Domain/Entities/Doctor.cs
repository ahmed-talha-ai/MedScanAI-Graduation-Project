using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedScanAI.Domain.Entities
{
    [Table("Doctors")]
    public class Doctor
    {
        [Key]
        [ForeignKey("ApplicationUser")]
        public string Id { get; set; }

        [Required]
        [ForeignKey("Specialization")]
        public int SpecializationId { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; }
        public int YearsOfExperience { get; set; }
        public bool IsActive { get; set; } = true;
        [Required]
        [MaxLength(20)]
        [Phone]
        public string PhoneNumber { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ApplicationUser ApplicationUser { get; set; }
        public Specialization Specialization { get; set; }

        public ICollection<DoctorSchedule> Schedules { get; set; } = new List<DoctorSchedule>();
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public DoctorExtra? Extra { get; set; }
        public ICollection<DoctorReview> Reviews { get; set; } = new List<DoctorReview>();
    }
}
