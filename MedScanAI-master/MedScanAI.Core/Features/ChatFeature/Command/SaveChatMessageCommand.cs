using MediatR;
using MedScanAI.Domain.Entities;
using MedScanAI.Infrastructure.Context;
using MedScanAI.Shared.Base;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace MedScanAI.Core.Features.ChatFeature.Command
{
    public class SaveChatMessageCommand : IRequest<ReturnBase<bool>>
    {
        public int SessionId { get; set; }
        public string SenderType { get; set; }
        public string MessageText { get; set; }
        public string? AttachmentUrl { get; set; }
    }

    public class SaveChatMessageCommandHandler : IRequestHandler<SaveChatMessageCommand, ReturnBase<bool>>
    {
        private readonly AppDbContext _context;

        public SaveChatMessageCommandHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ReturnBase<bool>> Handle(SaveChatMessageCommand request, CancellationToken cancellationToken)
        {
            if (request.SessionId == -1)
            {
                return new ReturnBase<bool>
                {
                    StatusCode = HttpStatusCode.OK,
                    Succeeded = true,
                    Data = true,
                    Message = "Message bypassed persistence for non-patient"
                };
            }

            var message = new AIChatMessage
            {
                SessionId = request.SessionId,
                SenderType = request.SenderType,
                MessageText = request.MessageText,
                AttachmentUrl = request.AttachmentUrl ?? "",
                CreatedAt = DateTime.UtcNow
            };

            _context.AIChatMessages.Add(message);
            await _context.SaveChangesAsync(cancellationToken);

            return new ReturnBase<bool>
            {
                StatusCode = HttpStatusCode.OK,
                Succeeded = true,
                Data = true,
                Message = "Message saved successfully"
            };
        }
    }
}
