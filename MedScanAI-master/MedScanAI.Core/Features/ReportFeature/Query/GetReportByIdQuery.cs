using MediatR;
using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace MedScanAI.Core.Features.ReportFeature.Query
{
    public class GetReportByIdQuery : IRequest<ReturnBase<AIReport>>
    {
        public int ReportId { get; set; }
    }

    public class GetReportByIdQueryHandler : IRequestHandler<GetReportByIdQuery, ReturnBase<AIReport>>
    {
        private readonly AppDbContext _context;

        public GetReportByIdQueryHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ReturnBase<AIReport>> Handle(GetReportByIdQuery request, CancellationToken cancellationToken)
        {
            var report = await _context.AIReports
                .FirstOrDefaultAsync(r => r.Id == request.ReportId, cancellationToken);

            if (report == null)
            {
                return new ReturnBase<AIReport>
                {
                    StatusCode = HttpStatusCode.NotFound,
                    Succeeded = false,
                    Message = "Report not found"
                };
            }

            return new ReturnBase<AIReport>
            {
                StatusCode = HttpStatusCode.OK,
                Succeeded = true,
                Data = report
            };
        }
    }
}
