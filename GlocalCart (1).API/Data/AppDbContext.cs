using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Models;

namespace GlocalCart.API.Data
{
    /// <summary>
    /// AppDbContext - Kế thừa IdentityDbContext để tích hợp ASP.NET Identity
    /// Cấu hình toàn bộ 18 bảng database + bảng Identity cho GlocalCart
    /// </summary>
    public class AppDbContext : IdentityDbContext<User, IdentityRole<int>, int>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // === NGƯỜI DÙNG & ĐỊA CHỈ ===
        public DbSet<UserAddress> UserAddresses { get; set; }
        public DbSet<CreditCard> CreditCards { get; set; }
        public DbSet<BankAccount> BankAccounts { get; set; }

        // === SẢN PHẨM & DANH MỤC ===
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<ProductReview> ProductReviews { get; set; }
        public DbSet<Catalog> Catalogs { get; set; }
        public DbSet<CatalogProduct> CatalogProducts { get; set; }

        // === GIỎ HÀNG ===
        public DbSet<CartItem> CartItems { get; set; }

        // === ĐƠN HÀNG & GIAO DỊCH ===
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<OrderLog> OrderLogs { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Shipment> Shipments { get; set; }
        public DbSet<ShipmentLog> ShipmentLogs { get; set; }
        public DbSet<ShipperLocation> ShipperLocations { get; set; }

        // === THÔNG BÁO ===
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ========================
            // USER - Cấu hình Index
            // ========================
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.HasIndex(u => u.UserName).IsUnique();
            });

            // ========================
            // USER ADDRESS
            // ========================
            modelBuilder.Entity<UserAddress>(entity =>
            {
                entity.HasOne(a => a.User)
                    .WithMany(u => u.Addresses)
                    .HasForeignKey(a => a.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ========================
            // SHIPPER LOCATION
            // ========================
            modelBuilder.Entity<ShipperLocation>(entity =>
            {
                entity.HasKey(l => l.ShipperId);

                entity.HasOne(l => l.Shipper)
                    .WithOne()
                    .HasForeignKey<ShipperLocation>(l => l.ShipperId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(l => l.UpdatedAt);
            });

            // ========================
            // CREDIT CARD
            // ========================
            modelBuilder.Entity<CreditCard>(entity =>
            {
                entity.HasOne(c => c.User)
                    .WithMany(u => u.CreditCards)
                    .HasForeignKey(c => c.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ========================
            // BANK ACCOUNT
            // ========================
            modelBuilder.Entity<BankAccount>(entity =>
            {
                entity.HasOne(b => b.User)
                    .WithMany(u => u.BankAccounts)
                    .HasForeignKey(b => b.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ========================
            // CATEGORY - Self-referencing
            // ========================
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasOne(c => c.ParentCategory)
                    .WithMany(c => c.SubCategories)
                    .HasForeignKey(c => c.ParentCategoryId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .IsRequired(false);
            });

            // ========================
            // PRODUCT
            // ========================
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasOne(p => p.Seller)
                    .WithMany(u => u.Products)
                    .HasForeignKey(p => p.SellerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.Category)
                    .WithMany(c => c.Products)
                    .HasForeignKey(p => p.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(p => p.Name);
                entity.HasIndex(p => p.CategoryId);
                entity.HasIndex(p => p.SellerId);
            });

            // ========================
            // PRODUCT IMAGE
            // ========================
            modelBuilder.Entity<ProductImage>(entity =>
            {
                entity.HasOne(pi => pi.Product)
                    .WithMany(p => p.Images)
                    .HasForeignKey(pi => pi.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Cấu hình cột ImageData lưu binary lớn
                entity.Property(pi => pi.ImageData)
                    .HasColumnType("varbinary(max)");
            });

            // ========================
            // PRODUCT REVIEW
            // ========================
            modelBuilder.Entity<ProductReview>(entity =>
            {
                entity.HasOne(r => r.Product)
                    .WithMany(p => p.Reviews)
                    .HasForeignKey(r => r.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.User)
                    .WithMany(u => u.Reviews)
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Order)
                    .WithMany()
                    .HasForeignKey(r => r.OrderId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Mỗi user chỉ đánh giá 1 lần cho mỗi sản phẩm trong 1 đơn
                entity.HasIndex(r => new { r.UserId, r.ProductId, r.OrderId }).IsUnique();
            });

            // ========================
            // CATALOG PRODUCT - Composite Key M-N
            // ========================
            modelBuilder.Entity<CatalogProduct>(entity =>
            {
                entity.HasKey(cp => new { cp.CatalogId, cp.ProductId });

                entity.HasOne(cp => cp.Catalog)
                    .WithMany(c => c.CatalogProducts)
                    .HasForeignKey(cp => cp.CatalogId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(cp => cp.Product)
                    .WithMany(p => p.CatalogProducts)
                    .HasForeignKey(cp => cp.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ========================
            // CART ITEM
            // ========================
            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.HasOne(ci => ci.User)
                    .WithMany(u => u.CartItems)
                    .HasForeignKey(ci => ci.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ci => ci.Product)
                    .WithMany(p => p.CartItems)
                    .HasForeignKey(ci => ci.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Mỗi user chỉ có 1 dòng cho mỗi sản phẩm trong giỏ
                entity.HasIndex(ci => new { ci.UserId, ci.ProductId }).IsUnique();
            });

            // ========================
            // ORDER
            // ========================
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasIndex(o => o.OrderNumber).IsUnique();

                entity.HasOne(o => o.Buyer)
                    .WithMany(u => u.Orders)
                    .HasForeignKey(o => o.BuyerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(o => o.ShippingAddress)
                    .WithMany()
                    .HasForeignKey(o => o.ShippingAddressId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ========================
            // ORDER ITEM
            // ========================
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasOne(oi => oi.Order)
                    .WithMany(o => o.OrderItems)
                    .HasForeignKey(oi => oi.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(oi => oi.Product)
                    .WithMany(p => p.OrderItems)
                    .HasForeignKey(oi => oi.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(oi => oi.Seller)
                    .WithMany()
                    .HasForeignKey(oi => oi.SellerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ========================
            // ORDER LOG
            // ========================
            modelBuilder.Entity<OrderLog>(entity =>
            {
                entity.HasOne(ol => ol.Order)
                    .WithMany(o => o.OrderLogs)
                    .HasForeignKey(ol => ol.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ========================
            // PAYMENT - 1:1 with Order
            // ========================
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasIndex(p => p.OrderId).IsUnique();

                entity.HasOne(p => p.Order)
                    .WithOne(o => o.Payment)
                    .HasForeignKey<Payment>(p => p.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ========================
            // SHIPMENT - 1:1 with Order
            // ========================
            modelBuilder.Entity<Shipment>(entity =>
            {
                entity.HasIndex(s => s.OrderId).IsUnique();
                entity.HasIndex(s => s.ShipperId);

                entity.HasOne(s => s.Order)
                    .WithOne(o => o.Shipment)
                    .HasForeignKey<Shipment>(s => s.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(s => s.Shipper)
                    .WithMany()
                    .HasForeignKey(s => s.ShipperId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .IsRequired(false);
            });

            // ========================
            // SHIPMENT LOG
            // ========================
            modelBuilder.Entity<ShipmentLog>(entity =>
            {
                entity.HasOne(sl => sl.Shipment)
                    .WithMany(s => s.ShipmentLogs)
                    .HasForeignKey(sl => sl.ShipmentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ========================
            // NOTIFICATION
            // ========================
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasOne(n => n.User)
                    .WithMany(u => u.Notifications)
                    .HasForeignKey(n => n.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(n => new { n.UserId, n.IsRead });
            });

            // ========================
            // SEED DATA - Roles & Categories
            // ========================
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Identity Roles
            modelBuilder.Entity<IdentityRole<int>>().HasData(
                new IdentityRole<int> { Id = 1, Name = "Member", NormalizedName = "MEMBER" },
                new IdentityRole<int> { Id = 2, Name = "Seller", NormalizedName = "SELLER" },
                new IdentityRole<int> { Id = 3, Name = "Admin", NormalizedName = "ADMIN" },
                new IdentityRole<int> { Id = 4, Name = "Shipper", NormalizedName = "SHIPPER" }
            );

            // Danh mục sản phẩm mẫu (theo yêu cầu)
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Điện tử", Description = "Thiết bị điện tử, công nghệ", ParentCategoryId = null, IsActive = true },
                new Category { Id = 2, Name = "Thời trang", Description = "Quần áo, giày dép, phụ kiện", ParentCategoryId = null, IsActive = true },
                new Category { Id = 3, Name = "Gia dụng", Description = "Đồ gia dụng, nội thất", ParentCategoryId = null, IsActive = true },
                new Category { Id = 4, Name = "Sách & Văn phòng phẩm", Description = "Sách, dụng cụ học tập", ParentCategoryId = null, IsActive = true },
                new Category { Id = 5, Name = "Sức khỏe & Làm đẹp", Description = "Mỹ phẩm, chăm sóc sức khỏe", ParentCategoryId = null, IsActive = true },
                // Sub-categories
                new Category { Id = 6, Name = "Điện thoại", Description = "Smartphone các hãng", ParentCategoryId = 1, IsActive = true },
                new Category { Id = 7, Name = "Laptop", Description = "Máy tính xách tay", ParentCategoryId = 1, IsActive = true },
                new Category { Id = 8, Name = "Phụ kiện điện tử", Description = "Tai nghe, sạc, ốp lưng", ParentCategoryId = 1, IsActive = true },
                new Category { Id = 9, Name = "Áo", Description = "Áo thun, áo sơ mi, áo khoác", ParentCategoryId = 2, IsActive = true },
                new Category { Id = 10, Name = "Quần", Description = "Quần jean, quần tây, quần short", ParentCategoryId = 2, IsActive = true },
                new Category { Id = 11, Name = "Giày dép", Description = "Giày thể thao, dép, sandal", ParentCategoryId = 2, IsActive = true },
                new Category { Id = 12, Name = "Đồ bếp", Description = "Nồi, chảo, dao, thớt", ParentCategoryId = 3, IsActive = true },
                new Category { Id = 13, Name = "Nội thất", Description = "Bàn, ghế, kệ, tủ", ParentCategoryId = 3, IsActive = true }
            );

            // Catalog mẫu
            modelBuilder.Entity<Catalog>().HasData(
                new Catalog { Id = 1, Name = "Sản phẩm nổi bật", LastUpdated = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Catalog { Id = 2, Name = "Bán chạy nhất", LastUpdated = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Catalog { Id = 3, Name = "Khuyến mãi", LastUpdated = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        }
    }
}
