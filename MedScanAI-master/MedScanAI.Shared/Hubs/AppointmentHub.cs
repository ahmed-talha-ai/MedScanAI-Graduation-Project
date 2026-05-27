using Microsoft.AspNetCore.SignalR;

namespace MedScanAI.Shared.Hubs
{
    public class AppointmentHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            await Clients.All.SendAsync("UserConnected", $"{Context.ConnectionId} joined");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Clients.All.SendAsync("UserDisconnected", $"{Context.ConnectionId} left");
            await base.OnDisconnectedAsync(exception);
        }

        public async Task NotifyAppointmentCreated(object appointmentData)
        {
            await Clients.All.SendAsync("AppointmentCreated", appointmentData);
        }

        public async Task NotifyAppointmentConfirmed(object appointmentData)
        {
            await Clients.All.SendAsync("AppointmentConfirmed", appointmentData);
        }

        public async Task NotifyAppointmentCancelled(object appointmentData)
        {
            await Clients.All.SendAsync("AppointmentCancelled", appointmentData);
        }
    }
}