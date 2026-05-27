using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MedScanAI.Domain.Entities
{
    [Table("DiagnosisHistory")]
    public class DiagnosisResult
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string PatientId { get; set; }

        [JsonIgnore]
        public int ModelType { get; set; }

        [NotMapped]
        [JsonPropertyName("modelType")]
        public string ModelTypeString
        {
            get => ModelType switch
            {
                0 => "brain-tumor",
                1 => "x-ray",
                2 => "breast-cancer",
                3 => "skin-disease",
                4 => "lab-ocr",
                _ => "brain-tumor"
            };
            set => ModelType = value.ToLower() switch
            {
                "brain-tumor" => 0,
                "x-ray" => 1,
                "breast-cancer" => 2,
                "skin-disease" => 3,
                "lab-ocr" => 4,
                _ => 0
            };
        }

        public DateTime DiagnosedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(500)]
        public string? InputImagePath { get; set; }

        [Required]
        [MaxLength(200)]
        public string ResultLabel { get; set; }

        public decimal? ConfidenceScore { get; set; }

        [Required]
        public string ResultText { get; set; }

        // Navigation
        [ForeignKey("PatientId")]
        public Patient Patient { get; set; }
    }
}
