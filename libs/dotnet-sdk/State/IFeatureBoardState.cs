using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.State;

public interface IFeatureBoardState
{
  DateTimeOffset? LastUpdated { get; }

  DateTimeOffset? LastModified { get; }

  FeatureBoardStateSnapshot GetSnapshot();

  Task InitialiseState(Dictionary<string, FeatureConfiguration>? features, DateTimeOffset? lastModified, CancellationToken cancellationToken);
  Task UpdateState(Dictionary<string, FeatureConfiguration>? features, DateTimeOffset? lastModified, CancellationToken cancellationToken);
}
