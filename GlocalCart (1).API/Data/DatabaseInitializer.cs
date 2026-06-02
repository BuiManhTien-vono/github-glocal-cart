using GlocalCart.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GlocalCart.API.Data;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        await EnsureChatTablesAsync(db);
        await EnsureFollowAndFavoriteTablesAsync(db);
        await EnsurePasswordResetOtpTableAsync(db);
        await EnsureUserProfileColumnsAsync(db);

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();

        await DbSeeder.SeedAsync(db, userManager, roleManager);
    }

    private static Task EnsureChatTablesAsync(AppDbContext db)
    {
        return db.Database.ExecuteSqlRawAsync(@"
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

    private static Task EnsureFollowAndFavoriteTablesAsync(AppDbContext db)
    {
        return db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'[dbo].[ShopFollows]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ShopFollows] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [ShopId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ShopFollows] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ShopFollows_AspNetUsers_ShopId] FOREIGN KEY ([ShopId]) REFERENCES [dbo].[AspNetUsers] ([Id]),
        CONSTRAINT [FK_ShopFollows_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF OBJECT_ID(N'[dbo].[ProductFavorites]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ProductFavorites] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [ProductId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ProductFavorites] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProductFavorites_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ProductFavorites_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ShopFollows_ShopId' AND object_id = OBJECT_ID(N'[dbo].[ShopFollows]'))
    CREATE INDEX [IX_ShopFollows_ShopId] ON [dbo].[ShopFollows] ([ShopId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ShopFollows_UserId_ShopId' AND object_id = OBJECT_ID(N'[dbo].[ShopFollows]'))
    CREATE UNIQUE INDEX [IX_ShopFollows_UserId_ShopId] ON [dbo].[ShopFollows] ([UserId], [ShopId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ProductFavorites_ProductId' AND object_id = OBJECT_ID(N'[dbo].[ProductFavorites]'))
    CREATE INDEX [IX_ProductFavorites_ProductId] ON [dbo].[ProductFavorites] ([ProductId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ProductFavorites_UserId_ProductId' AND object_id = OBJECT_ID(N'[dbo].[ProductFavorites]'))
    CREATE UNIQUE INDEX [IX_ProductFavorites_UserId_ProductId] ON [dbo].[ProductFavorites] ([UserId], [ProductId]);
");
    }

    private static Task EnsurePasswordResetOtpTableAsync(AppDbContext db)
    {
        return db.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID(N'[dbo].[PasswordResetOtps]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[PasswordResetOtps] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [Email] nvarchar(200) NOT NULL,
        [CodeHash] nvarchar(128) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UsedAt] datetime2 NULL,
        CONSTRAINT [PK_PasswordResetOtps] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PasswordResetOtps_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PasswordResetOtps_Email_CodeHash' AND object_id = OBJECT_ID(N'[dbo].[PasswordResetOtps]'))
    CREATE INDEX [IX_PasswordResetOtps_Email_CodeHash] ON [dbo].[PasswordResetOtps] ([Email], [CodeHash]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PasswordResetOtps_ExpiresAt' AND object_id = OBJECT_ID(N'[dbo].[PasswordResetOtps]'))
    CREATE INDEX [IX_PasswordResetOtps_ExpiresAt] ON [dbo].[PasswordResetOtps] ([ExpiresAt]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PasswordResetOtps_UserId' AND object_id = OBJECT_ID(N'[dbo].[PasswordResetOtps]'))
    CREATE INDEX [IX_PasswordResetOtps_UserId] ON [dbo].[PasswordResetOtps] ([UserId]);
");
    }

    private static Task EnsureUserProfileColumnsAsync(AppDbContext db)
    {
        return db.Database.ExecuteSqlRawAsync(@"
IF COL_LENGTH(N'[dbo].[AspNetUsers]', N'Gender') IS NULL
    ALTER TABLE [dbo].[AspNetUsers] ADD [Gender] nvarchar(20) NULL;

IF COL_LENGTH(N'[dbo].[AspNetUsers]', N'DateOfBirth') IS NULL
    ALTER TABLE [dbo].[AspNetUsers] ADD [DateOfBirth] datetime2 NULL;

IF COL_LENGTH(N'[dbo].[AspNetUsers]', N'AvatarUrl') IS NULL
    ALTER TABLE [dbo].[AspNetUsers] ADD [AvatarUrl] nvarchar(500) NULL;
");
    }
}
