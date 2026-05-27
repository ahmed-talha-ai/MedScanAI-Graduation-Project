using MediatR;
using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace MedScanAI.Core.Features.DiagnosisFeature.Command
{
    public class SaveDiagnosisCommand : IRequest<ReturnBase<bool>>
    {
        public string PatientId { get; set; }
        public string ModelType { get; set; }
        public string ResultLabel { get; set; }
        public decimal? ConfidenceScore { get; set; }
        public string ResultText { get; set; }
        public string? InputImagePath { get; set; }
    }

    public class SaveDiagnosisCommandHandler : IRequestHandler<SaveDiagnosisCommand, ReturnBase<bool>>
    {
        private readonly AppDbContext _context;

        public SaveDiagnosisCommandHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ReturnBase<bool>> Handle(SaveDiagnosisCommand request, CancellationToken cancellationToken)
        {
            var patientExists = await _context.Patients.AnyAsync(p => p.Id == request.PatientId, cancellationToken);
            if (!patientExists)
            {
                return new ReturnBase<bool>
                {
                    StatusCode = HttpStatusCode.OK,
                    Succeeded = true,
                    Data = true,
                    Message = "Diagnosis bypassed persistence for non-patient"
                };
            }

            var diagnosis = new DiagnosisResult
            {
                PatientId = request.PatientId,
                ModelTypeString = request.ModelType,
                ResultLabel = request.ResultLabel,
                ConfidenceScore = request.ConfidenceScore,
                ResultText = request.ResultText,
                InputImagePath = request.InputImagePath,
                DiagnosedAt = DateTime.UtcNow
            };

            _context.DiagnosisResults.Add(diagnosis);
            await _context.SaveChangesAsync(cancellationToken);

            return new ReturnBase<bool>
            {
                StatusCode = HttpStatusCode.OK,
                Succeeded = true,
                Data = true,
                Message = "Diagnosis saved successfully"
            };
        }
    }
}
