using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.State;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FeatureBoard.DotnetSdk.UpdateStrategies;

public class PollingUpdateStrategyBackgroundService : BackgroundService
{
  private readonly IFeatureBoardState _state;
  private readonly IOptions<FeatureBoardOptions> _options;
  private readonly IFeatureBoardHttpClient _featureBoardHttpClient;
  private readonly ILogger<PollingUpdateStrategyBackgroundService> _logger;

  public PollingUpdateStrategyBackgroundService(IFeatureBoardState state, IOptions<FeatureBoardOptions> options, IFeatureBoardHttpClient featureBoardHttpClient, ILogger<PollingUpdateStrategyBackgroundService> logger)
  {
    _state = state;
    _options = options;
    _featureBoardHttpClient = featureBoardHttpClient;
    _logger = logger;
  }



  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
  {
    _logger.LogInformation("Polling Update Strategy Background Service running.");

    // When the timer should have no due-time, then do the work once now.
    await InitialiseState(stoppingToken);

    using PeriodicTimer timer = new(TimeSpan.FromMilliseconds(_options.Value.MaxAgeMs));

    try
    {
      while (await timer.WaitForNextTickAsync(stoppingToken))
      {
        await UpdateState(stoppingToken);
      }
    }
    catch (OperationCanceledException)
    {
      _logger.LogInformation("Polling Update Strategy Background Service is stopping.");
    }
  }

  private async Task InitialiseState(CancellationToken cancellationToken)
  {
    _logger.LogDebug("Initialising State");
    var (features, lastModified) = await _featureBoardHttpClient.FetchUpdates(_state.LastModified, cancellationToken);
    await _state.InitialiseState(features, lastModified ?? _state.LastModified, cancellationToken);
  }

  private async Task UpdateState(CancellationToken cancellationToken)
  {
    _logger.LogDebug("Fetching updates");
    var (features, lastModified) = await _featureBoardHttpClient.FetchUpdates(_state.LastModified, cancellationToken);
    await _state.UpdateState(features, lastModified ?? _state.LastModified, cancellationToken);
  }
}
