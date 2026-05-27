using Microsoft.AspNetCore.Identity;

namespace MedScanAI.Domain.Entities
{
    public class ApplicationUser : IdentityUser<string>
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Patient Patient { get; set; }
        public Doctor Doctor { get; set; }
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}
