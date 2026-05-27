using MediatR;
using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace MedScanAI.Core.Features.ChatFeature.Command
{
    public class StartChatSessionCommand : IRequest<ReturnBase<int>>
    {
        public string PatientId { get; set; }
        public string? LanguageUsed { get; set; } = "ar";
    }

    public class StartChatSessionCommandHandler : IRequestHandler<StartChatSessionCommand, ReturnBase<int>>
    {
        private readonly AppDbContext _context;

        public StartChatSessionCommandHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ReturnBase<int>> Handle(StartChatSessionCommand request, CancellationToken cancellationToken)
        {
            var patientExists = await _context.Patients.AnyAsync(p => p.Id == request.PatientId, cancellationToken);
            if (!patientExists)
            {
                return new ReturnBase<int>
                {
                    StatusCode = HttpStatusCode.OK,
                    Succeeded = true,
                    Data = -1, // Dummy Session ID for non-patients (e.g. Doctors using AI tools)
                    Message = "Chat session started (Not persisted for non-patients)"
                };
            }

            var session = new AIChatSession
            {
                PatientId = request.PatientId,
                LanguageUsed = request.LanguageUsed ?? "ar",
                StartedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.AIChatSessions.Add(session);
            await _context.SaveChangesAsync(cancellationToken);

            return new ReturnBase<int>
            {
                StatusCode = HttpStatusCode.OK,
                Succeeded = true,
                Data = session.Id,
                Message = "Chat session started successfully"
            };
        }
    }
}
