using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Abstracts;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Infrastructure.RepositoryBase;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;

namespace MedScanAI.Infrastructure.Repositories
{
    internal class CurrentMedicationRepository : BaseRepository<PatientCurrentMedication>, ICurrentMedicationRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly DbSet<PatientCurrentMedication> _dbSet;


        public CurrentMedicationRepository(AppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
            _dbSet = _dbContext.Set<PatientCurrentMedication>();
        }

        public async Task<ReturnBase<List<string>>> GetCurrentMedicationsByPatientId(string patientId)
        {
            var medications = await _dbSet
                .Where(m => m.PatientId == patientId)
                .Select(m => m.Name)
                .ToListAsync();

            return new ReturnBase<List<string>>(medications);
        }
    }
}
