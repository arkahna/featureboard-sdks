using FeatureBoard.DotnetSdk.Models;
using System.Collections.Concurrent;

namespace FeatureBoard.DotnetSdk.State;


public class FeatureBoardState : IFeatureBoardState
{
  public DateTimeOffset? LastUpdated { get; private set; }
  public DateTimeOffset? LastModified { get; private set; }
  private readonly IFeatureBoardExternalState? _externalState;
  private static readonly ConcurrentDictionary<string, FeatureConfiguration> _cache = new(StringComparer.OrdinalIgnoreCase);

  public FeatureBoardState(IFeatureBoardExternalState? externalState = null)
  {
    _externalState = externalState;
  }

  public FeatureBoardStateSnapshot GetSnapshot() => new(_cache);

  public async Task InitialiseState(List<FeatureConfiguration>? features, DateTimeOffset? lastModified, CancellationToken cancellationToken)
  {

    if (_cache.Any())
      throw new InvalidOperationException("Cache has already been initialised");

    if (features is null && _externalState is not null)
    {
      features = await _externalState.GetState(cancellationToken);
    }

    foreach (var feature in features ?? new List<FeatureConfiguration>())
    {
      _cache[feature.FeatureKey] = feature;
    }

    LastUpdated = DateTimeOffset.UtcNow;
    LastModified = lastModified;
  }

  public async Task UpdateState(List<FeatureConfiguration>? features, DateTimeOffset? lastModified, CancellationToken cancellationToken)
  {
    if (features is not null)
    {
      foreach (var feature in features)
      {
        _cache[feature.FeatureKey] = feature;
      }

      var newKeys = features.Select(x => x.FeatureKey);
      var unusedKeys = _cache.Keys.Where(x => !newKeys.Contains(x));
      foreach (var unusedKey in unusedKeys)
      {
        _cache.TryRemove(unusedKey, out _);
      }

      if (_externalState is not null)
        await _externalState.UpdateState(new List<FeatureConfiguration>(_cache.Values), cancellationToken);

      LastModified = lastModified;
    }

    LastUpdated = DateTimeOffset.UtcNow;
  }
}
