using System.ComponentModel.DataAnnotations;

namespace FeatureBoard.DotnetSdk.Models;

public class FeatureBoardOptions
{
  public Uri HttpEndpoint { get; init; } = new("https://client.featureboard.app", UriKind.Absolute);
  [Required]
  public string EnvironmentApiKey { get; init; } = null!;


  private readonly TimeSpan _maxAge = TimeSpan.FromMinutes(1);
  public TimeSpan MaxAge
  {
    get => _maxAge;
    init => _maxAge = TimeSpan.FromSeconds(1) < value ? value : TimeSpan.FromSeconds(1); //Max age shouldn't be less than one second
  }
}
