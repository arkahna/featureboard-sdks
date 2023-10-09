using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.State;

public class FeatureBoardStateSnapshot
{
  private readonly IReadOnlyDictionary<string, FeatureConfiguration> _snapshot;

  public FeatureBoardStateSnapshot(IReadOnlyDictionary<string, FeatureConfiguration> state)
  {
    _snapshot = state;
  }

  public FeatureConfiguration? Get(string featureKey)
  {
    return _snapshot.TryGetValue(featureKey, out var feature)
      ? feature
      : null;
  }
}
