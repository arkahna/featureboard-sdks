using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.State;

public class FeatureBoardStateSnapshot
{
  private readonly IReadOnlyDictionary<string, FeatureConfiguration> _snapshot;

  public FeatureBoardStateSnapshot(Dictionary<string, FeatureConfiguration> state)
  {
    _snapshot = new Dictionary<string, FeatureConfiguration>(state, state.Comparer);
  }

  public FeatureConfiguration? Get(string featureKey)
  {
    return _snapshot.TryGetValue(featureKey, out var feature)
      ? feature
      : null;
  }
}
