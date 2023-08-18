using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.State;

public interface IFeatureBoardExternalState
{
  Task<IReadOnlyCollection<FeatureConfiguration>> GetState(CancellationToken cancellationToken);
  Task UpdateState(IReadOnlyCollection<FeatureConfiguration> features, CancellationToken cancellationToken);
}
