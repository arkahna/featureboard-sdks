using FeatureBoard.DotnetSdk.Registration;
using FeatureBoardSdk.Examples.DotnetApi.Models;
using FeatureBoardSdk.Examples.DotnetApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register featureBoard
builder.Services.AddHttpContextAccessor(); // dependency of QueryStringAudienceProvider
builder.Services.AddFeatureBoard<WeatherFeatures, QueryStringAudienceProvider>()
  .WithPollingUpdateStrategy();

var app = builder.Build();

// Add featureBoard middleware
app.UseFeatureBoard();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
