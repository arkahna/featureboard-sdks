using FeatureBoard.DotnetSdk.Attributes;
using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoardSdk.Examples.DotnetApi.Models;

public class WeatherFeatures : IFeatures
{
  [FeatureKeyName("weather-imperial")]
  public bool WeatherImperial { get; set; }
}
