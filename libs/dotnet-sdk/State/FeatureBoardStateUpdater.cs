using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.State;

/// <summary>
/// Adapter around FeatureBoardState to allow Update to be called in IFeatureBoardStateUpdateHandler conformant manner
/// </summary>
internal class FeatureBoardStateUpdater : IFeatureBoardStateUpdateHandler
{
  private readonly FeatureBoardState _state;

  public FeatureBoardStateUpdater(FeatureBoardState state) => _state = state;

  public virtual Task UpdateState(IReadOnlyCollection<FeatureConfiguration> configuration, CancellationToken cancellation)
  {
    if (cancellation.IsCancellationRequested)
      return Task.FromCanceled(cancellation);

    try
    {
      _state.Update(configuration);
      return Task.CompletedTask;
    }
    catch (Exception e)
    {
      return Task.FromException(e);
    }
  }
}
