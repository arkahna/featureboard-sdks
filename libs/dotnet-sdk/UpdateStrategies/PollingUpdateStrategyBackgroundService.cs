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
  private bool _initialised = false;

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
    await UpdateState(stoppingToken);

    using PeriodicTimer timer = new(_options.Value.MaxAge);

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

  private async Task UpdateState(CancellationToken cancellationToken)
  {
    try
    {
      _logger.LogDebug("Fetching updates");
      var (features, lastModified) = await _featureBoardHttpClient.FetchUpdates(_state.LastModified, cancellationToken);
      if (_initialised)
      {
        _logger.LogDebug("Updating State");
        await _state.UpdateState(features, lastModified ?? _state.LastModified, cancellationToken);
        return;
      }

      _logger.LogDebug("Initialising State");
      await _state.InitialiseState(features, lastModified ?? _state.LastModified, cancellationToken);
      _initialised = true;
    }
    catch (Exception exception)
    {
      // Unhandled errors will cause the background service to restart the app
      _logger.LogError(exception, "Error occurred calling UpdateState in (PollingUpdateStrategyBackgroundService) message: {message}", exception.Message);
    }
  }
}
