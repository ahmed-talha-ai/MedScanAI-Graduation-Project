using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Infrastructure.RepositoryBase;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Infrastructure.Repositories
{
    internal class PatientRepository : BaseRepository<Patient>, IPatientRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly DbSet<Patient> _dbSet;
        public PatientRepository(AppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
            _dbSet = _dbContext.Set<Patient>();
        }

        public async Task<ReturnBase<Patient>> GetPatientAsync(string id)
        {
            try
            {
                var patient = await _dbSet.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

                if (patient is null)
                    return ReturnBaseHandler.Failed<Patient>("Patient Not Found");

                return ReturnBaseHandler.Success(patient);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<Patient>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<int>> GetPatientsCountAsync()
        {
            try
            {
                var count = await _dbSet.CountAsync();
                return ReturnBaseHandler.Success(count);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<int>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
