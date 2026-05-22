using GlocalCart.BankGateway.Services;

var builder = WebApplication.CreateBuilder(args);

// === SERVICES ===
builder.Services.AddSingleton<GatewayService>();
builder.Services.AddHttpClient();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// === SWAGGER ===
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "🏦 GlocalCart Bank Gateway Simulator",
        Version = "v1",
        Description = "Cổng thanh toán ngân hàng mô phỏng (bên thứ 3). " +
                      "Nhận yêu cầu xác minh chuyển khoản từ GlocalCart API, " +
                      "xử lý sau một khoảng delay, rồi gọi webhook ngược về."
    });
});

// === CORS ===
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// === MIDDLEWARE ===
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Bank Gateway v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");
app.MapControllers();

// === STARTUP LOG ===
var gatewayConfig = app.Configuration.GetSection("GatewaySettings");
var gatewayName = gatewayConfig["GatewayName"] ?? "Bank Gateway";
var autoApprove = bool.TryParse(gatewayConfig["AutoApprove"], out var a) && a;
var delayMs = gatewayConfig["AutoProcessDelayMs"] ?? "5000";
var targetApi = gatewayConfig["GlocalCartApiUrl"] ?? "http://localhost:5000";

app.Logger.LogInformation("");
app.Logger.LogInformation("╔══════════════════════════════════════════════════════════╗");
app.Logger.LogInformation("║  🏦 {GatewayName}                                       ", gatewayName);
app.Logger.LogInformation("║  Mode: {Mode}                                           ", autoApprove ? "Auto-Approve ✅" : "Manual 🔧");
app.Logger.LogInformation("║  Delay: {Delay}ms                                       ", delayMs);
app.Logger.LogInformation("║  Webhook Target: {Target}                               ", targetApi);
app.Logger.LogInformation("║  Swagger: http://localhost:5100/swagger                  ");
app.Logger.LogInformation("╚══════════════════════════════════════════════════════════╝");
app.Logger.LogInformation("");

app.Run();
