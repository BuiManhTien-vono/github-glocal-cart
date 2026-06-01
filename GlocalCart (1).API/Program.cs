using GlocalCart.API.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddGlocalCartDatabase(builder.Configuration)
    .AddGlocalCartIdentity()
    .AddGlocalCartAuthentication(builder.Configuration)
    .AddGlocalCartApplicationServices()
    .AddGlocalCartPresentation();

var app = builder.Build();

app.UseGlocalCartPipeline();
app.MapGlocalCartEndpoints();

await app.InitializeGlocalCartDatabaseAsync();

app.Run();
