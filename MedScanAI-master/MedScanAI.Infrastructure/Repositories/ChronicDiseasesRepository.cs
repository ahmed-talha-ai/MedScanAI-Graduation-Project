using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Infrastructure.RepositoryBase;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Infrastructure.Repositories
{
    internal class ChronicDiseasesRepository : BaseRepository<PatientChronicDisease>, IChronicDiseasesRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly DbSet<PatientChronicDisease> _dbSet;

        public ChronicDiseasesRepository(AppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
            _dbSet = _dbContext.Set<PatientChronicDisease>();
        }

        public async Task<ReturnBase<List<string>>> GetChronicDiseasesByPatientId(string patientId)
        {
            try
            {
                var diseases = await _dbSet.Where(c => c.PatientId == patientId)
                    .Select(c => c.Name)
                    .ToListAsync();
                return ReturnBaseHandler.Success(diseases);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<string>>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
