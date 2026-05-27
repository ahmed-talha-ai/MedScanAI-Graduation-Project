using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedScanAI.Domain.Entities
{
    [Table("AIChatMessages")]
    public class AIChatMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("AIChatSession")]
        public int SessionId { get; set; }

        [Required]
        [MaxLength(20)]
        public string SenderType { get; set; } // Patient, AI

        [Required]
        public string MessageText { get; set; }

        [MaxLength(500)]
        public string AttachmentUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public AIChatSession AIChatSession { get; set; }
    }
}
