using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedScanAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientNotificationPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAppointmentNotificationEnabled",
                table: "Patients",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCampaignNotificationEnabled",
                table: "Patients",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredLanguage",
                table: "Patients",
                type: "nvarchar(5)",
                maxLength: 5,
                nullable: false,
                defaultValue: "ar");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAppointmentNotificationEnabled",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "IsCampaignNotificationEnabled",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "PreferredLanguage",
                table: "Patients");
        }
    }
}
