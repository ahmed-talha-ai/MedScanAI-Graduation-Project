using MediatR;
using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace MedScanAI.Core.Features.ReportFeature.Query
{
    public class GetReportHistoryQuery : IRequest<ReturnBase<List<AIReport>>>
    {
        public string PatientId { get; set; }
    }

    public class GetReportHistoryQueryHandler : IRequestHandler<GetReportHistoryQuery, ReturnBase<List<AIReport>>>
    {
        private readonly AppDbContext _context;

        public GetReportHistoryQueryHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ReturnBase<List<AIReport>>> Handle(GetReportHistoryQuery request, CancellationToken cancellationToken)
        {
            var reports = await _context.AIReports
                .Where(r => r.PatientId == request.PatientId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(cancellationToken);

            return new ReturnBase<List<AIReport>>
            {
                StatusCode = HttpStatusCode.OK,
                Succeeded = true,
                Data = reports
            };
        }
    }
}
