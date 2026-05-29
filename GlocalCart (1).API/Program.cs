using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using GlocalCart.API.Data;
using GlocalCart.API.Helpers;
using GlocalCart.API.Hubs;
using GlocalCart.API.Middleware;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;
using GlocalCart.API.Services.Implementations;

var builder = WebApplication.CreateBuilder(args);

// === DATABASE ===
builder.Services.AddDbContext<AppDbContext>(options => {
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlServerOptionsAction: sqlOptions =>
        {
            sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
        });
    options.ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// === ASP.NET IDENTITY ===
builder.Services.AddIdentity<User, IdentityRole<int>>(options =>
{
    // Password policy
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;

    // User settings
    options.User.RequireUniqueEmail = true;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// === JWT AUTHENTICATION ===
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!))
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/hubs/delivery") || path.StartsWithSegments("/hubs/chat")))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// === DEPENDENCY INJECTION ===
builder.Services.AddSingleton<JwtHelper>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IShipperService, ShipperService>();
builder.Services.AddScoped<IUploadService, UploadService>();
builder.Services.AddHttpClient();
builder.Services.AddSignalR();

builder.Services.AddHostedService<AutoCancelOrderService>();

// === CONTROLLERS ===
builder.Services.AddControllers(options =>
{
    // Đăng ký AccountStatus filter toàn cục
    options.Filters.Add<AccountStatusFilter>();
})
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// === SWAGGER ===
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// === CORS - Cho phép React Native / Expo kết nối ===
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
    });
});

var app = builder.Build();

// === MIDDLEWARE PIPELINE ===

// Global Exception Handler
app.UseMiddleware<ExceptionMiddleware>();

// Swagger (luôn bật cho dev)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "GlocalCart API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");

app.UseStaticFiles(); // Cho phép truy cập ảnh từ wwwroot

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<DeliveryHub>("/hubs/delivery");
app.MapHub<ChatHub>("/hubs/chat");

// === AUTO MIGRATE DATABASE & SEED DATA ===
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    await EnsureChatTablesAsync(db);
    
    // Đổ dữ liệu mẫu vào DB (dùng UserManager từ Identity)
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();
    await DbSeeder.SeedAsync(db, userManager, roleManager);
}

app.Run();

static async Task EnsureChatTablesAsync(AppDbContext db)
{
    await db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'[dbo].[ChatConversations]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ChatConversations] (
        [Id] int NOT NULL IDENTITY,
        [BuyerId] int NOT NULL,
        [SellerId] int NOT NULL,
        [ProductId] int NULL,
        [LastMessage] nvarchar(1000) NULL,
        [LastMessageSenderId] int NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ChatConversations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChatConversations_AspNetUsers_BuyerId] FOREIGN KEY ([BuyerId]) REFERENCES [dbo].[AspNetUsers] ([Id]),
        CONSTRAINT [FK_ChatConversations_AspNetUsers_SellerId] FOREIGN KEY ([SellerId]) REFERENCES [dbo].[AspNetUsers] ([Id]),
        CONSTRAINT [FK_ChatConversations_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE SET NULL
    );
END;

IF OBJECT_ID(N'[dbo].[ChatMessages]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ChatMessages] (
        [Id] int NOT NULL IDENTITY,
        [ConversationId] int NOT NULL,
        [SenderId] int NOT NULL,
        [Text] nvarchar(2000) NULL,
        [ImageUrl] nvarchar(500) NULL,
        [IsRead] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ChatMessages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChatMessages_ChatConversations_ConversationId] FOREIGN KEY ([ConversationId]) REFERENCES [dbo].[ChatConversations] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ChatMessages_AspNetUsers_SenderId] FOREIGN KEY ([SenderId]) REFERENCES [dbo].[AspNetUsers] ([Id])
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChatConversations_BuyerId_SellerId' AND object_id = OBJECT_ID(N'[dbo].[ChatConversations]'))
    CREATE UNIQUE INDEX [IX_ChatConversations_BuyerId_SellerId] ON [dbo].[ChatConversations] ([BuyerId], [SellerId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChatConversations_SellerId' AND object_id = OBJECT_ID(N'[dbo].[ChatConversations]'))
    CREATE INDEX [IX_ChatConversations_SellerId] ON [dbo].[ChatConversations] ([SellerId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChatConversations_ProductId' AND object_id = OBJECT_ID(N'[dbo].[ChatConversations]'))
    CREATE INDEX [IX_ChatConversations_ProductId] ON [dbo].[ChatConversations] ([ProductId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChatConversations_UpdatedAt' AND object_id = OBJECT_ID(N'[dbo].[ChatConversations]'))
    CREATE INDEX [IX_ChatConversations_UpdatedAt] ON [dbo].[ChatConversations] ([UpdatedAt]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChatMessages_ConversationId_CreatedAt' AND object_id = OBJECT_ID(N'[dbo].[ChatMessages]'))
    CREATE INDEX [IX_ChatMessages_ConversationId_CreatedAt] ON [dbo].[ChatMessages] ([ConversationId], [CreatedAt]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChatMessages_ConversationId_IsRead' AND object_id = OBJECT_ID(N'[dbo].[ChatMessages]'))
    CREATE INDEX [IX_ChatMessages_ConversationId_IsRead] ON [dbo].[ChatMessages] ([ConversationId], [IsRead]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ChatMessages_SenderId' AND object_id = OBJECT_ID(N'[dbo].[ChatMessages]'))
    CREATE INDEX [IX_ChatMessages_SenderId] ON [dbo].[ChatMessages] ([SenderId]);
");
}
