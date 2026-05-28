using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GlocalCart.API.Migrations
{
    [Migration("20260528070000_NormalizeSellerAddressesToHaNoi")]
    public partial class NormalizeSellerAddressesToHaNoi : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE ua
                SET StreetAddress = N'Hoan Kiem',
                    City = N'Ha Noi',
                    State = N'Ha Noi',
                    Zipcode = N'100000',
                    Country = N'Viet Nam'
                FROM UserAddresses ua
                INNER JOIN AspNetUsers u ON u.Id = ua.UserId
                WHERE u.IsSeller = 1
                   OR EXISTS (SELECT 1 FROM Products p WHERE p.SellerId = u.Id);

                INSERT INTO UserAddresses (UserId, StreetAddress, City, State, Zipcode, Country, IsDefault)
                SELECT u.Id, N'Hoan Kiem', N'Ha Noi', N'Ha Noi', N'100000', N'Viet Nam', CAST(1 AS bit)
                FROM AspNetUsers u
                WHERE (u.IsSeller = 1 OR EXISTS (SELECT 1 FROM Products p WHERE p.SellerId = u.Id))
                  AND NOT EXISTS (SELECT 1 FROM UserAddresses ua WHERE ua.UserId = u.Id);
                """
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
