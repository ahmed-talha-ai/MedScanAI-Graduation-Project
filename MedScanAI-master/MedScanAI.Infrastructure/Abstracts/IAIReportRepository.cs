using MedScanAI.Domain.Entities;
using MedScanAI.Domain.IBaseRepository;
using MedScanAI.Shared.Base;

namespace MedScanAI.Infrastructure.Abstracts
{
    public interface IAIReportRepository : IBaseRepository<AIReport>
    {
        Task<ReturnBase<AIReport>> GetPatientExistingReportAsync(string patientId);
    }
}
