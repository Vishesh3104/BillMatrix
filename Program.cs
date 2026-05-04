using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Application.Services;
using BILLMATRIX1.Infrastructure.Repositories;
using BILLMATRIX1.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// SignalR
builder.Services.AddSignalR();

// CORS
// REPLACE your CORS section with this:
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy => policy
        .WithOrigins(
            "http://localhost:5147",
            "https://localhost:5147",
            "http://localhost:3000",
            "https://localhost:7283"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());  // needed for SignalR
});
// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = jwtSettings["Key"];
if (!string.IsNullOrEmpty(key))
{
    // Replace your JWT AddAuthentication block with this:
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtSettings["Issuer"],
            ValidAudience            = jwtSettings["Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
        };
        // ✅ ADD THIS — allows SignalR to use JWT from query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });
}

// ========================
// Dependency Injection
// ========================
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();

builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<ICustomerService, CustomerService>();

builder.Services.AddScoped<ISellerRepository, SellerRepository>();
builder.Services.AddScoped<ISellerService, SellerService>();

builder.Services.AddScoped<IAdminRepository, AdminRepository>();
builder.Services.AddScoped<IAdminService, AdminService>();

builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();

var app = builder.Build();

// Middleware
app.UseStaticFiles();
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");

//app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notification");

app.Run();
