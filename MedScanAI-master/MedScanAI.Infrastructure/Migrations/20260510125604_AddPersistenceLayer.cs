using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedScanAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPersistenceLayer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DiagnosisResults_Patients_PatientId",
                table: "DiagnosisResults");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DiagnosisResults",
                table: "DiagnosisResults");

            migrationBuilder.DropColumn(
                name: "ClassLabel",
                table: "DiagnosisResults");

            migrationBuilder.DropColumn(
                name: "ConfidenceLevel",
                table: "DiagnosisResults");

            migrationBuilder.DropColumn(
                name: "ServiceType",
                table: "DiagnosisResults");

            migrationBuilder.RenameTable(
                name: "DiagnosisResults",
                newName: "DiagnosisHistory");

            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                table: "DiagnosisHistory",
                newName: "ResultLabel");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "DiagnosisHistory",
                newName: "DiagnosedAt");

            migrationBuilder.RenameIndex(
                name: "IX_DiagnosisResults_PatientId",
                table: "DiagnosisHistory",
                newName: "IX_DiagnosisHistory_PatientId");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "DiagnosisHistory",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<decimal>(
                name: "ConfidenceScore",
                table: "DiagnosisHistory",
                type: "decimal(18,4)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InputImagePath",
                table: "DiagnosisHistory",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ModelType",
                table: "DiagnosisHistory",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_DiagnosisHistory",
                table: "DiagnosisHistory",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "ChatSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PatientId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatSessions_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedicalReports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PatientId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReportText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReportType = table.Column<int>(type: "int", nullable: false),
                    PdfPath = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedicalReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedicalReports_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMessages_ChatSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "ChatSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_SessionId",
                table: "ChatMessages",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatSessions_PatientId",
                table: "ChatSessions",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_MedicalReports_PatientId",
                table: "MedicalReports",
                column: "PatientId");

            migrationBuilder.AddForeignKey(
                name: "FK_DiagnosisHistory_Patients_PatientId",
                table: "DiagnosisHistory",
                column: "PatientId",
                principalTable: "Patients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DiagnosisHistory_Patients_PatientId",
                table: "DiagnosisHistory");

            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "MedicalReports");

            migrationBuilder.DropTable(
                name: "ChatSessions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DiagnosisHistory",
                table: "DiagnosisHistory");

            migrationBuilder.DropColumn(
                name: "ConfidenceScore",
                table: "DiagnosisHistory");

            migrationBuilder.DropColumn(
                name: "InputImagePath",
                table: "DiagnosisHistory");

            migrationBuilder.DropColumn(
                name: "ModelType",
                table: "DiagnosisHistory");

            migrationBuilder.RenameTable(
                name: "DiagnosisHistory",
                newName: "DiagnosisResults");

            migrationBuilder.RenameColumn(
                name: "ResultLabel",
                table: "DiagnosisResults",
                newName: "ImageUrl");

            migrationBuilder.RenameColumn(
                name: "DiagnosedAt",
                table: "DiagnosisResults",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_DiagnosisHistory_PatientId",
                table: "DiagnosisResults",
                newName: "IX_DiagnosisResults_PatientId");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "DiagnosisResults",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<string>(
                name: "ClassLabel",
                table: "DiagnosisResults",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ConfidenceLevel",
                table: "DiagnosisResults",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ServiceType",
                table: "DiagnosisResults",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DiagnosisResults",
                table: "DiagnosisResults",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DiagnosisResults_Patients_PatientId",
                table: "DiagnosisResults",
                column: "PatientId",
                principalTable: "Patients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
