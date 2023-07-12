using System.ComponentModel.DataAnnotations;

namespace FeatureBoard.DotnetSdk.Models;

public class FeatureBoardOptions
{
  public Uri HttpEndpoint { get; init; } = new("https://client.featureboard.app");
  [Required]
  public string EnvironmentApiKey { get; init; } = null!;


  private readonly int _maxAgeMs = 60000; // 1 minute
  public int MaxAgeMs
  {
    get => _maxAgeMs;
    init => _maxAgeMs = Math.Max(1000, value); //Max age shouldn't be less than one second
  }
}
