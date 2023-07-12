using FeatureBoard.DotnetSdk.Models;
using System.Collections.Concurrent;

namespace FeatureBoard.DotnetSdk.State;


public class FeatureBoardState : IFeatureBoardState
{
  public DateTimeOffset? LastUpdated { get; private set; }
  public DateTimeOffset? LastModified { get; private set; }
  private readonly IFeatureBoardExternalState? _externalState;

  private static readonly ConcurrentDictionary<string, FeatureConfiguration> _cache = new(StringComparer.OrdinalIgnoreCase);

  public FeatureBoardState(IFeatureBoardExternalState? externalState)
  {
    _externalState = externalState;
  }

  public FeatureBoardStateSnapshot GetSnapshot() => new(_cache);

  public async Task InitialiseState(Dictionary<string, FeatureConfiguration>? features, DateTimeOffset? lastModified, CancellationToken cancellationToken)
  {
    if (features is null && _externalState is not null)
    {
      features = await _externalState.GetState(cancellationToken);
    }

    foreach (var featureConfiguration in features ?? new Dictionary<string, FeatureConfiguration>())
    {
      _cache[featureConfiguration.Key] = featureConfiguration.Value;
    }

    LastUpdated = DateTimeOffset.UtcNow;
    LastModified = lastModified;
  }

  public async Task UpdateState(Dictionary<string, FeatureConfiguration>? features, DateTimeOffset? lastModified, CancellationToken cancellationToken)
  {
    if (features is not null)
    {
      foreach (var featureConfiguration in features)
      {
        _cache[featureConfiguration.Key] = featureConfiguration.Value;
      }

      var newKeys = features.Keys;
      var unusedKeys = _cache.Keys.Where(x => !newKeys.Contains(x));
      foreach (var unusedKey in unusedKeys)
      {
        _cache.TryRemove(unusedKey, out _);
      }

      if (_externalState is not null)
        await _externalState.UpdateState(new Dictionary<string, FeatureConfiguration>(_cache), cancellationToken);

      LastModified = lastModified;
    }

    LastUpdated = DateTimeOffset.UtcNow;
  }
}
