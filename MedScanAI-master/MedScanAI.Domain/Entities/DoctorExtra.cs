using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedScanAI.Domain.Entities
{
    [Table("DoctorExtras")]
    public class DoctorExtra
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Doctor")]
        public string DoctorId { get; set; }

        [MaxLength(1000)]
        public string? Bio { get; set; }

        [MaxLength(500)]
        public string? ClinicAddress { get; set; }

        public decimal? ConsultationFee { get; set; }

        [MaxLength(100)]
        public string? Governorate { get; set; }

        public string? PhotoBase64 { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Doctor Doctor { get; set; }
    }
}
