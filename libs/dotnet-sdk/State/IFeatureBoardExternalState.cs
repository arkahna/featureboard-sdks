using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.State;

public interface IFeatureBoardExternalState
{
  Task<List<FeatureConfiguration>> GetState(CancellationToken cancellationToken);
  Task UpdateState(List<FeatureConfiguration> features, CancellationToken cancellationToken);
}
