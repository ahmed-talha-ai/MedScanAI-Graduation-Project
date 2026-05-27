using MedScanAI.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Infrastructure.Context
{
    public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Patient> Patients { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<Specialization> Specializations { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<DoctorSchedule> DoctorSchedules { get; set; }
        public DbSet<PatientAllergy> PatientAllergies { get; set; }
        public DbSet<PatientChronicDisease> PatientChronicDiseases { get; set; }
        public DbSet<PatientFamilyHistory> PatientFamilyHistories { get; set; }
        public DbSet<PatientCurrentMedication> PatientCurrentMedications { get; set; }
        public DbSet<AIChatSession> AIChatSessions { get; set; }
        public DbSet<AIChatMessage> AIChatMessages { get; set; }
        public DbSet<AIReport> AIReports { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<DiagnosisResult> DiagnosisResults { get; set; }
        public DbSet<DoctorExtra> DoctorExtras { get; set; }
        public DbSet<DoctorReview> DoctorReviews { get; set; }
        public DbSet<WebsiteReview> WebsiteReviews { get; set; }
        public DbSet<ChildProfile> ChildProfiles { get; set; }
        public DbSet<GrowthRecord> GrowthRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ============================================
            // PATIENT RELATIONSHIPS
            // ============================================

            modelBuilder.Entity<Patient>()
                .Property(p => p.IsAppointmentNotificationEnabled)
                .HasDefaultValue(true);

            modelBuilder.Entity<Patient>()
                .Property(p => p.IsCampaignNotificationEnabled)
                .HasDefaultValue(true);

            modelBuilder.Entity<Patient>()
                .Property(p => p.PreferredLanguage)
                .HasDefaultValue("ar");

            // Patient 1-to-1 with ApplicationUser
            modelBuilder.Entity<Patient>()
                .HasOne(p => p.ApplicationUser)
                .WithOne(u => u.Patient)
                .HasForeignKey<Patient>(p => p.Id)
                .OnDelete(DeleteBehavior.Cascade);

            // Patient 1-to-Many with Allergies
            modelBuilder.Entity<PatientAllergy>()
                .HasOne(a => a.Patient)
                .WithMany(p => p.Allergies)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            // Patient 1-to-Many with ChildProfiles
            modelBuilder.Entity<ChildProfile>()
                .HasOne(c => c.Patient)
                .WithMany(p => p.ChildProfiles)
                .HasForeignKey(c => c.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            // ChildProfile 1-to-Many with GrowthRecords
            modelBuilder.Entity<GrowthRecord>()
                .HasOne(g => g.ChildProfile)
                .WithMany(c => c.GrowthRecords)
                .HasForeignKey(g => g.ChildProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            // Patient 1-to-Many with Chronic Diseases
            modelBuilder.Entity<PatientChronicDisease>()
                .HasOne(d => d.Patient)
                .WithMany(p => p.ChronicDiseases)
                .HasForeignKey(d => d.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            // Patient 1-to-Many with Family Histories
            modelBuilder.Entity<PatientFamilyHistory>()
                .HasOne(f => f.Patient)
                .WithMany(p => p.FamilyHistories)
                .HasForeignKey(f => f.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            // Patient 1-to-Many with Current Medications
            modelBuilder.Entity<PatientCurrentMedication>()
                .HasOne(m => m.Patient)
                .WithMany(p => p.CurrentMedications)
                .HasForeignKey(m => m.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            // Patient 1-to-Many with Chat Sessions
            modelBuilder.Entity<AIChatSession>()
                .HasOne(s => s.Patient)
                .WithMany(p => p.ChatSessions)
                .HasForeignKey(s => s.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            // Patient 1-to-Many with AI Reports

            // Patient 1-to-Many with Appointments
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

            // ============================================
            // DOCTOR RELATIONSHIPS
            // ============================================

            // Doctor 1-to-1 with ApplicationUser
            modelBuilder.Entity<Doctor>()
                .HasOne(d => d.ApplicationUser)
                .WithOne(u => u.Doctor)
                .HasForeignKey<Doctor>(d => d.Id)
                .OnDelete(DeleteBehavior.Cascade);

            // Doctor Many-to-1 with Specialization
            modelBuilder.Entity<Doctor>()
                .HasOne(d => d.Specialization)
                .WithMany(s => s.Doctors)
                .HasForeignKey(d => d.SpecializationId)
                .OnDelete(DeleteBehavior.Restrict); // Don't delete doctor if specialization is deleted

            // Doctor 1-to-Many with Schedules
            modelBuilder.Entity<DoctorSchedule>()
                .HasOne(s => s.Doctor)
                .WithMany(d => d.Schedules)
                .HasForeignKey(s => s.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Doctor 1-to-Many with Appointments
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Doctor)
                .WithMany(d => d.Appointments)
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

            // ============================================
            // AI CHAT SESSION RELATIONSHIPS
            // ============================================

            // AIChatSession 1-to-Many with Messages
            modelBuilder.Entity<AIChatMessage>()
                .HasOne(m => m.AIChatSession)
                .WithMany(s => s.Messages)
                .HasForeignKey(m => m.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            // ============================================
            // APPOINTMENT RELATIONSHIPS
            // ============================================

            // Appointment Optional 1-to-1 with AIReport
            modelBuilder.Entity<AIReport>()
                .HasOne(r => r.Appointment)
                .WithOne(a => a.AIReport)
                .HasForeignKey<AIReport>(r => r.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull); // If appointment deleted, set AppointmentId to null


            // ============================================ 
            // REFRESH TOKEN RELATIONSHIPS
            // ============================================

            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.ToTable("RefreshTokens");

                entity.HasKey(rt => rt.Id);

                entity.Property(rt => rt.UserRefreshToken)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(rt => rt.JwtId)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(rt => rt.IsUsed)
                    .HasDefaultValue(false);

                entity.Property(rt => rt.IsRevoked)
                    .HasDefaultValue(false);

                entity.Property(rt => rt.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()")
                    .ValueGeneratedOnAdd();

                // Relationships
                entity.HasOne(rt => rt.User)
                    .WithMany(u => u.RefreshTokens)
                    .HasForeignKey(rt => rt.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Indexes
                entity.HasIndex(rt => rt.UserRefreshToken)
                    .IsUnique()
                    .HasDatabaseName("IX_RefreshTokens_Token_Unique");

                entity.HasIndex(rt => rt.JwtId);
                entity.HasIndex(rt => rt.UserId);
                entity.HasIndex(rt => rt.ExpiresAt);
                entity.HasIndex(rt => new { rt.IsUsed, rt.IsRevoked, rt.ExpiresAt });
            });

            // ============================================
            // INDEXES FOR PERFORMANCE
            // ============================================

            // Patient indexes
            modelBuilder.Entity<Patient>()
                .HasIndex(p => p.Email)
                .IsUnique();

            modelBuilder.Entity<Patient>()
                .HasIndex(p => p.PhoneNumber);

            // Doctor indexes
            modelBuilder.Entity<Doctor>()
                .HasIndex(d => d.SpecializationId);

            modelBuilder.Entity<Doctor>()
                .HasIndex(d => d.IsActive);

            // Appointment indexes
            modelBuilder.Entity<Appointment>()
                .HasIndex(a => a.PatientId);

            modelBuilder.Entity<Appointment>()
                .HasIndex(a => a.DoctorId);

            modelBuilder.Entity<Appointment>()
                .HasIndex(a => a.Date);

            modelBuilder.Entity<Appointment>()
                .HasIndex(a => a.Status);

            // DoctorSchedule indexes
            modelBuilder.Entity<DoctorSchedule>()
                .HasIndex(s => new { s.DoctorId, s.DayOfWeek });

            // AIChatSession indexes
            modelBuilder.Entity<AIChatSession>()
                .HasIndex(s => s.PatientId);

            modelBuilder.Entity<AIChatSession>()
                .HasIndex(s => s.StartedAt);

            // AIReport indexes
            modelBuilder.Entity<AIReport>()
                .HasIndex(r => r.PatientId);

            modelBuilder.Entity<AIReport>()
                .HasIndex(r => r.AppointmentId);

            // DiagnosisResult indexes and relationships
            modelBuilder.Entity<DiagnosisResult>()
                .HasOne(d => d.Patient)
                .WithMany()
                .HasForeignKey(d => d.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DiagnosisResult>()
                .HasIndex(d => d.PatientId);
            modelBuilder.Entity<DiagnosisResult>()
                .HasIndex(d => d.ModelType);
            modelBuilder.Entity<DiagnosisResult>()
                .HasIndex(d => d.DiagnosedAt);

            modelBuilder.Entity<DiagnosisResult>()
                .Property(d => d.ConfidenceScore)
                .HasColumnType("decimal(18,2)");

            // ============================================
            // DOCTOR EXTRAS & REVIEWS RELATIONSHIPS
            // ============================================

            modelBuilder.Entity<DoctorExtra>()
                .Property(e => e.ConsultationFee)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<DoctorExtra>()
                .HasIndex(e => e.DoctorId)
                .IsUnique();

            modelBuilder.Entity<DoctorReview>()
                .HasOne(r => r.Doctor)
                .WithMany(d => d.Reviews)
                .HasForeignKey(r => r.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DoctorReview>()
                .HasOne(r => r.Patient)
                .WithMany(p => p.DoctorReviews)
                .HasForeignKey(r => r.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DoctorReview>()
                .HasIndex(r => new { r.DoctorId, r.PatientId })
                .IsUnique();

            modelBuilder.Entity<WebsiteReview>()
                .HasIndex(r => r.PatientId)
                .IsUnique();

            // ============================================
            // SEED DATA
            // ============================================

            modelBuilder.Entity<Specialization>().HasData(
                new Specialization { Id = 1, Name = "الأمراض الجلدية", Description = "تشخيص وعلاج أمراض الجلد والشعر والأظافر" },
                new Specialization { Id = 2, Name = "طب الأعصاب", Description = "تشخيص وعلاج أمراض واضطرابات الدماغ والجهاز العصبي" },
                new Specialization { Id = 3, Name = "أمراض الصدر", Description = "تشخيص وعلاج أمراض الجهاز التنفسي والرئتين" }
            );

        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }
        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }
        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                if (entry.Entity.GetType().GetProperty("UpdatedAt") != null)
                {
                    entry.Property("UpdatedAt").CurrentValue = DateTime.UtcNow;
                }

                if (entry.State == EntityState.Added &&
                    entry.Entity.GetType().GetProperty("CreatedAt") != null)
                {
                    entry.Property("CreatedAt").CurrentValue = DateTime.UtcNow;
                }
            }
        }
    }
}
