using GlocalCart.API.Data;
using GlocalCart.API.Hubs;
using GlocalCart.API.Middleware;

namespace GlocalCart.API.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication UseGlocalCartPipeline(this WebApplication app)
    {
        app.UseMiddleware<ExceptionMiddleware>();

        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "GlocalCart API v1");
            options.RoutePrefix = "swagger";
        });

        app.UseCors("AllowAll");
        app.UseStaticFiles();
        app.UseAuthentication();
        app.UseAuthorization();

        return app;
    }

    public static WebApplication MapGlocalCartEndpoints(this WebApplication app)
    {
        app.MapControllers();
        app.MapHealthChecks("/health");
        app.MapHub<DeliveryHub>("/hubs/delivery");
        app.MapHub<ChatHub>("/hubs/chat");

        return app;
    }

    public static Task InitializeGlocalCartDatabaseAsync(this WebApplication app)
    {
        return DatabaseInitializer.InitializeAsync(app.Services);
    }
}
