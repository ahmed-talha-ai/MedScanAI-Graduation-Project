using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Infrastructure.RepositoryBase;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Infrastructure.Repositories
{
    public class PatientFamilyHistoryRepository : BaseRepository<PatientFamilyHistory>, IPatientFamilyHistoryRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly DbSet<PatientFamilyHistory> _patientFamilyHistories;

        public PatientFamilyHistoryRepository(AppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
            _patientFamilyHistories = dbContext.Set<PatientFamilyHistory>();
        }

        public async Task<ReturnBase<List<string>>> GetFamilyHistoriesByPatientId(string patientId)
        {
            try
            {
                var histories = await _patientFamilyHistories
                    .Where(f => f.PatientId == patientId)
                    .Select(f => f.Name)
                    .ToListAsync();
                return ReturnBaseHandler.Success(histories);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<string>>(ex.Message);
            }
        }
    }
}
