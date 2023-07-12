using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace FeatureBoard.DotnetSdk.Models;

public record FeatureConfiguration
{
  [JsonPropertyName("featureKey")]
  public string FeatureKey { get; init; } = null!;
  [JsonPropertyName("defaultValue")]
  public JsonValue DefaultValue { get; init; } = null!;
  [JsonPropertyName("audienceExceptions")]
  public AudienceExceptionValue[] AudienceExceptions { get; init; } = null!;
}
