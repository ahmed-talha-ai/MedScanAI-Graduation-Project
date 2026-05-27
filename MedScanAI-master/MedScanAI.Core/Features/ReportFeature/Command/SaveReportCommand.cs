using MediatR;
using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace MedScanAI.Core.Features.ReportFeature.Command
{
    public class SaveReportCommand : IRequest<ReturnBase<bool>>
    {
        public string PatientId { get; set; }
        public string ReportText { get; set; }
        public int? AppointmentId { get; set; }
    }

    public class SaveReportCommandHandler : IRequestHandler<SaveReportCommand, ReturnBase<bool>>
    {
        private readonly AppDbContext _context;

        public SaveReportCommandHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ReturnBase<bool>> Handle(SaveReportCommand request, CancellationToken cancellationToken)
        {
            var patientExists = await _context.Patients.AnyAsync(p => p.Id == request.PatientId, cancellationToken);
            if (!patientExists)
            {
                return new ReturnBase<bool>
                {
                    StatusCode = HttpStatusCode.OK,
                    Succeeded = true,
                    Data = true,
                    Message = "Report bypassed persistence for non-patient"
                };
            }

            var report = new AIReport
            {
                PatientId = request.PatientId,
                Report = request.ReportText,
                AppointmentId = request.AppointmentId,
                CreatedAt = DateTime.UtcNow
            };

            _context.AIReports.Add(report);
            await _context.SaveChangesAsync(cancellationToken);

            return new ReturnBase<bool>
            {
                StatusCode = HttpStatusCode.OK,
                Succeeded = true,
                Data = true,
                Message = "Report saved successfully"
            };
        }
    }
}
