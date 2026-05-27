using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Infrastructure.RepositoryBase;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Infrastructure.Repositories
{
    internal class PatientAllergiesRepository : BaseRepository<PatientAllergy>, IPatientAllergiesRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly DbSet<PatientAllergy> _dbSet;

        public PatientAllergiesRepository(AppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
            _dbSet = _dbContext.Set<PatientAllergy>();
        }


        public async Task<ReturnBase<List<string>>> GetAllergiesByPatientId(string patientId)
        {
            try
            {
                var allergies = await _dbSet
                    .Where(a => a.PatientId == patientId)
                    .Select(a => a.Name)
                    .ToListAsync();

                return ReturnBaseHandler.Success(allergies);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<string>>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
