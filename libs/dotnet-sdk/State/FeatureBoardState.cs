using FeatureBoard.DotnetSdk.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace FeatureBoard.DotnetSdk.State;


internal sealed class FeatureBoardState : IFeatureBoardState, IHostedService
{
  private readonly IServiceScopeFactory _scopeFactory;
  private readonly IFeatureBoardExternalState? _externalState;

  private Dictionary<string, FeatureConfiguration> _cache = new(0);

  public FeatureBoardState(IServiceScopeFactory scopeFactory, IFeatureBoardExternalState? externalState = null)
  {
    _scopeFactory = scopeFactory;
    _externalState = externalState;
  }

  public FeatureBoardStateSnapshot GetSnapshot() => new FeatureBoardStateSnapshot(_cache);


  public void Update(IReadOnlyCollection<FeatureConfiguration> state) => _cache = state.ToDictionary(s => s.FeatureKey, s => s);

  public async Task StartAsync(CancellationToken cancellationToken)
  {
    using var scope = _scopeFactory.CreateScope();
    var updated = await scope.ServiceProvider.GetRequiredService<IFeatureBoardService>().RefreshFeatureConfiguration(cancellationToken) ?? false;
    if (updated || _externalState is null)
      return;

    var state = await _externalState.GetState(cancellationToken);
    if (state == null)
      return;

    Update(state);
  }

  public async Task StopAsync(CancellationToken cancellationToken)
  {
    if (_externalState is not null)
      await _externalState.UpdateState(_cache.Values, cancellationToken);
  }
}
