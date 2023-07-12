using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.State;

public class FeatureBoardStateSnapshot
{
  private readonly Dictionary<string, FeatureConfiguration> _snapshot;

  public FeatureBoardStateSnapshot(IEnumerable<KeyValuePair<string, FeatureConfiguration>> state)
  {
    _snapshot = new Dictionary<string, FeatureConfiguration>(state, StringComparer.OrdinalIgnoreCase);
  }
  public FeatureConfiguration? Get(string featureKey)
  {
    return _snapshot.TryGetValue(featureKey, out var feature)
      ? feature
      : null;
  }
}
