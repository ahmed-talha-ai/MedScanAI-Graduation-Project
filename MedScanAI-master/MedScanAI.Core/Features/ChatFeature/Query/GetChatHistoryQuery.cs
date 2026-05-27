using MediatR;
using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace MedScanAI.Core.Features.ChatFeature.Query
{
    public class GetChatHistoryQuery : IRequest<ReturnBase<List<AIChatSession>>>
    {
        public string PatientId { get; set; }
    }

    public class GetChatHistoryQueryHandler : IRequestHandler<GetChatHistoryQuery, ReturnBase<List<AIChatSession>>>
    {
        private readonly AppDbContext _context;

        public GetChatHistoryQueryHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ReturnBase<List<AIChatSession>>> Handle(GetChatHistoryQuery request, CancellationToken cancellationToken)
        {
            var sessions = await _context.AIChatSessions
                .Include(s => s.Messages)
                .Where(s => s.PatientId == request.PatientId)
                .OrderByDescending(s => s.StartedAt)
                .ToListAsync(cancellationToken);

            return new ReturnBase<List<AIChatSession>>
            {
                StatusCode = HttpStatusCode.OK,
                Succeeded = true,
                Data = sessions
            };
        }
    }
}
