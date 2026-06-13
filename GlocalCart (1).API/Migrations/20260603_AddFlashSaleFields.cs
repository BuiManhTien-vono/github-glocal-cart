using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GlocalCart.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFlashSaleFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFlashSale",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "FlashSaleDiscount",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFlashSale",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "FlashSaleDiscount",
                table: "Products");
        }
    }
}
