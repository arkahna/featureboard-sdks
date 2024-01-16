using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.State;

public interface IFeatureBoardExternalState : IFeatureBoardStateUpdateHandler
{
  Task<IReadOnlyCollection<FeatureConfiguration>> GetState(CancellationToken cancellationToken);
}
