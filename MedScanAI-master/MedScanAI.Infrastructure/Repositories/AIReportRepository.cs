using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Infrastructure.RepositoryBase;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Infrastructure.Repositories
{
    internal class AIReportRepository : BaseRepository<AIReport>, IAIReportRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly DbSet<AIReport> _dbSet;

        public AIReportRepository(AppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
            _dbSet = _dbContext.Set<AIReport>();
        }

        public async Task<ReturnBase<AIReport>> GetPatientExistingReportAsync(string patientId)
        {
            try
            {
                var report = await _dbSet
                    .Where(r => r.PatientId == patientId)
                    .OrderByDescending(r => r.CreatedAt)
                    .FirstOrDefaultAsync();

                if (report == null)
                    return ReturnBaseHandler.Success<AIReport>(null!);

                return ReturnBaseHandler.Success(report);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<AIReport>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
