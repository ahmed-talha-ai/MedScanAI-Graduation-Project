using MedScanAI.API.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace MedScanAI.API.Controllers
{
    [Route("api/notifications/[action]")]
    public class NotificationController : ControllerBase
    {
        [HttpGet]
        [Authorize]
        public IActionResult GetUserNotifications()
        {
            var notifications = new List<object>
            {
                new { 
                    Id = Guid.NewGuid().ToString(),
                    Title = "Appointment Confirmed",
                    Body = "Your appointment with Dr. Smith is confirmed for tomorrow at 10 AM.",
                    Date = DateTime.UtcNow.AddMinutes(-5).ToString("o"),
                    IsRead = false,
                    Type = "Appointment"
                },
                new { 
                    Id = Guid.NewGuid().ToString(),
                    Title = "Medical Report Ready",
                    Body = "Your chest X-ray diagnosis report has been generated.",
                    Date = DateTime.UtcNow.AddHours(-2).ToString("o"),
                    IsRead = true,
                    Type = "Report"
                },
                new { 
                    Id = Guid.NewGuid().ToString(),
                    Title = "Welcome to Sebar",
                    Body = "Thank you for registering. Make sure to complete your profile.",
                    Date = DateTime.UtcNow.AddDays(-1).ToString("o"),
                    IsRead = true,
                    Type = "System"
                }
            };
            
            return Ok(new { Succeeded = true, Data = notifications, Message = "Success" });
        }
    }
}
