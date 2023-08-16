using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.State;

public interface IFeatureBoardState
{
  DateTimeOffset? LastUpdated { get; }

  string? ETag { get; }

  FeatureBoardStateSnapshot GetSnapshot();

  Task InitialiseState(List<FeatureConfiguration>? features, string? eTag, CancellationToken cancellationToken);
  Task UpdateState(List<FeatureConfiguration>? features, string? eTag, CancellationToken cancellationToken);
}
