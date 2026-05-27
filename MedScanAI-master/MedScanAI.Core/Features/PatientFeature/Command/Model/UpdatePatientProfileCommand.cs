using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.PatientFeature.Command.Model
{
    public class UpdatePatientProfileCommand : IRequest<ReturnBase<bool>>
    {
        public string Id { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Gender { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? BloodType { get; set; }
        public List<string>? FamilyHistory { get; set; }
        public List<string>? ChronicDiseases { get; set; }
        public List<string>? Allergies { get; set; }
        public List<string>? CurrentMedications { get; set; }
    }
}
