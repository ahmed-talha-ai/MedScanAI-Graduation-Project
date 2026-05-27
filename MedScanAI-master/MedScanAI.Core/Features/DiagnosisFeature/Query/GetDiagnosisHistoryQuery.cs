using MediatR;
using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace MedScanAI.Core.Features.DiagnosisFeature.Query
{
    public class GetDiagnosisHistoryQuery : IRequest<ReturnBase<List<DiagnosisResult>>>
    {
        public string PatientId { get; set; }
        public string? ModelType { get; set; }
    }

    public class GetDiagnosisHistoryQueryHandler : IRequestHandler<GetDiagnosisHistoryQuery, ReturnBase<List<DiagnosisResult>>>
    {
        private readonly AppDbContext _context;

        public GetDiagnosisHistoryQueryHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ReturnBase<List<DiagnosisResult>>> Handle(GetDiagnosisHistoryQuery request, CancellationToken cancellationToken)
        {
            var query = _context.DiagnosisResults.AsQueryable()
                .Where(x => x.PatientId == request.PatientId);

            if (!string.IsNullOrEmpty(request.ModelType))
            {
                int filterModelType = request.ModelType.ToLower() switch
                {
                    "brain-tumor" => 0,
                    "x-ray" => 1,
                    "breast-cancer" => 2,
                    "skin-disease" => 3,
                    "lab-ocr" => 4,
                    _ => 0
                };
                query = query.Where(x => x.ModelType == filterModelType);
            }

            var results = await query.OrderByDescending(x => x.DiagnosedAt).ToListAsync(cancellationToken);

            return new ReturnBase<List<DiagnosisResult>>
            {
                StatusCode = HttpStatusCode.OK,
                Succeeded = true,
                Data = results
            };
        }
    }
}
