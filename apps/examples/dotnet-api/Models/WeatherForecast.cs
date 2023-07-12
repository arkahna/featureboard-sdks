namespace FeatureBoardSdk.Examples.DotnetApi.Models;

public class WeatherForecast
{
  public DateOnly Date { get; set; }
  public TemperatureScale Scale { get; set; }

  public int Temperature { get; set; }

  public string? Summary { get; set; }
}
