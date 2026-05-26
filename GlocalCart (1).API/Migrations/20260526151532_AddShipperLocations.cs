using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GlocalCart.API.Migrations
{
    /// <inheritdoc />
    [Migration("20260526151532_AddShipperLocations")]
    public partial class AddShipperLocations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShipperLocations",
                columns: table => new
                {
                    ShipperId = table.Column<int>(type: "int", nullable: false),
                    Latitude = table.Column<double>(type: "float", nullable: false),
                    Longitude = table.Column<double>(type: "float", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShipperLocations", x => x.ShipperId);
                    table.ForeignKey(
                        name: "FK_ShipperLocations_AspNetUsers_ShipperId",
                        column: x => x.ShipperId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShipperLocations_UpdatedAt",
                table: "ShipperLocations",
                column: "UpdatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShipperLocations");
        }
    }
}
