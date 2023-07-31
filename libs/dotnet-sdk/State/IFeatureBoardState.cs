using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.State;

public interface IFeatureBoardState
{
  DateTimeOffset? LastUpdated { get; }

  DateTimeOffset? LastModified { get; }

  FeatureBoardStateSnapshot GetSnapshot();

  Task InitialiseState(List<FeatureConfiguration>? features, DateTimeOffset? lastModified, CancellationToken cancellationToken);
  Task UpdateState(List<FeatureConfiguration>? features, DateTimeOffset? lastModified, CancellationToken cancellationToken);
}
