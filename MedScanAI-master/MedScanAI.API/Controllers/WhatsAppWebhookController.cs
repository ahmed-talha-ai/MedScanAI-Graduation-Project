using MedScanAI.Service.Abstracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace MedScanAI.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WhatsAppWebhookController : ControllerBase
    {
        private readonly IWhatsAppService _whatsAppService;
        private readonly ILogger<WhatsAppWebhookController> _logger;

        // You can change this to any string you want, but it MUST match the Verify Token in Meta Dashboard
        private const string VerifyToken = "mediscan_webhook_123";

        public WhatsAppWebhookController(IWhatsAppService whatsAppService, ILogger<WhatsAppWebhookController> logger)
        {
            _whatsAppService = whatsAppService;
            _logger = logger;
        }

        // 1. Webhook Verification (GET)
        // Meta calls this when you first register the webhook URL
        [HttpGet]
        public IActionResult VerifyWebhook(
            [FromQuery(Name = "hub.mode")] string mode,
            [FromQuery(Name = "hub.verify_token")] string token,
            [FromQuery(Name = "hub.challenge")] string challenge)
        {
            if (mode == "subscribe" && token == VerifyToken)
            {
                _logger.LogInformation("Webhook verified successfully!");
                return Ok(challenge);
            }

            _logger.LogWarning("Webhook verification failed. Mode: {Mode}, Token: {Token}", mode, token);
            return Forbid();
        }

        // 2. Receiving Messages (POST)
        // Meta calls this when a user sends a message to your WhatsApp number
        [HttpPost]
        public async Task<IActionResult> ReceiveMessage([FromBody] JsonElement payload)
        {
            try
            {
                // Check if it's a valid WhatsApp message event
                if (payload.TryGetProperty("object", out var objProperty) && objProperty.GetString() == "whatsapp_business_account")
                {
                    if (payload.TryGetProperty("entry", out var entryArray) && entryArray.GetArrayLength() > 0)
                    {
                        var entry = entryArray[0];
                        if (entry.TryGetProperty("changes", out var changesArray) && changesArray.GetArrayLength() > 0)
                        {
                            var value = changesArray[0].GetProperty("value");

                            // Check if this change contains a message (and not just a delivery status update)
                            if (value.TryGetProperty("messages", out var messagesArray) && messagesArray.GetArrayLength() > 0)
                            {
                                var message = messagesArray[0];
                                
                                // Get the sender's phone number
                                if (message.TryGetProperty("from", out var fromProperty))
                                {
                                    var senderPhoneNumber = fromProperty.GetString();

                                    _logger.LogInformation("Received message from {PhoneNumber}. Sending auto-reply...", senderPhoneNumber);

                                    // Send the auto-reply
                                    var replyText = "شكراً لتواصلكم مع MediScan. هذا الرقم مخصص للإشعارات التلقائية فقط.";
                                    
                                    // Send async without waiting to quickly return 200 OK to Meta
                                    _ = _whatsAppService.SendTextMessageAsync(senderPhoneNumber, replyText);
                                }
                            }
                        }
                    }
                }

                // Always return 200 OK to Meta, otherwise they will retry sending the same message
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing WhatsApp Webhook payload");
                // Return 200 OK even on error to prevent Meta from spamming retries
                return Ok();
            }
        }
    }
}
