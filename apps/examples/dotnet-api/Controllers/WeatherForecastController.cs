using FeatureBoard.DotnetSdk;
using FeatureBoardSdk.Examples.DotnetApi.Models;
using Microsoft.AspNetCore.Mvc;

namespace FeatureBoardSdk.Examples.DotnetApi.Controllers;

[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{
  private static readonly string[] _summaries = new[]
  {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

  private readonly ILogger<WeatherForecastController> _logger;
  private readonly IFeatureBoardClient<WeatherFeatures> _featureBoardClient;

  public WeatherForecastController(ILogger<WeatherForecastController> logger, IFeatureBoardClient<WeatherFeatures> featureBoardClient)
  {
    _logger = logger;
    _featureBoardClient = featureBoardClient;
  }

  [HttpGet(Name = "GetWeatherForecast")]
  public ActionResult<WeatherForecast[]> Get()
  {
    if (_featureBoardClient.GetFeatureValue(features => features.WeatherImperial, false))
    {
      return Ok(Enumerable.Range(1, 5).Select(index => new WeatherForecast
      {
        Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
        Scale = TemperatureScale.Fahrenheit,
        Temperature = 32 + (int)(Random.Shared.Next(-20, 55) / 0.5556),
        Summary = _summaries[Random.Shared.Next(_summaries.Length)]
      })
        .ToArray());
    }
    else
    {
      return Ok(Enumerable.Range(1, 5).Select(index => new WeatherForecast
      {
        Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
        Scale = TemperatureScale.Celsius,
        Temperature = Random.Shared.Next(-20, 55),
        Summary = _summaries[Random.Shared.Next(_summaries.Length)]
      })
        .ToArray());
    }
  }
}
