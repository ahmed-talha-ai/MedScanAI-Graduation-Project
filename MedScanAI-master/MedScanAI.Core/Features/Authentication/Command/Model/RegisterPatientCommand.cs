using MediatR;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.Authentication.Command.Model
{
    public class RegisterPatientCommand : IRequest<ReturnBase<bool>>
    {
        public string FullName { get; set; }
        public string Password { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Gender { get; set; }
        public DateOnly DateOfBirth { get; set; }
        public string? BloodType { get; set; }
        public List<string>? ChronicDiseases { get; set; }
        public List<string>? FamilyHistory { get; set; }
        public List<string>? Allergies { get; set; }
        public List<string>? CurrentMedications { get; set; }
    }
}
