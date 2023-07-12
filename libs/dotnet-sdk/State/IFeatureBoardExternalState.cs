using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.State;

public interface IFeatureBoardExternalState
{
  Task<Dictionary<string, FeatureConfiguration>> GetState(CancellationToken cancellationToken);
  Task UpdateState(Dictionary<string, FeatureConfiguration> features, CancellationToken cancellationToken);
}
