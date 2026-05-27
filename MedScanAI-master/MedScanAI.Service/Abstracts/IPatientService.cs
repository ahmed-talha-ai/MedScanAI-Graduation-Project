using MedScanAI.Shared.Base;

namespace MedScanAI.Service.Abstracts
{
    public interface IPatientService
    {
        Task<ReturnBase<int>> GetPatientsCountAsync();
    }
}
