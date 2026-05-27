using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedScanAI.Domain.Entities
{
    [Table("GrowthRecords")]
    public class GrowthRecord
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("ChildProfile")]
        public int ChildProfileId { get; set; }

        [Required]
        public DateTime Date { get; set; } = DateTime.UtcNow;

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal WeightKg { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? HeightCm { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ChildProfile ChildProfile { get; set; }
    }
}
