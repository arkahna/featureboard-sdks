using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.State;

public interface IFeatureBoardStateUpdateHandler
{
  Task UpdateState(IReadOnlyCollection<FeatureConfiguration> configuration, CancellationToken cancellation);
}
