using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace FeatureBoard.DotnetSdk.Models;

public record AudienceExceptionValue
{
  [JsonPropertyName("audienceKey")]
  public string AudienceKey { get; init; } = null!;
  [JsonPropertyName("value")]
  public JsonValue Value { get; init; } = null!;
}
