using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.State;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FeatureBoard.DotnetSdk.UpdateStrategies;

public class PollingUpdateStrategyBackgroundService : BackgroundService
{
  private readonly IOptions<FeatureBoardOptions> _options;
  private readonly IServiceScopeFactory _scopeFactory;
  private readonly ILogger<PollingUpdateStrategyBackgroundService> _logger;
  private bool _initialised = false;

  public PollingUpdateStrategyBackgroundService(IOptions<FeatureBoardOptions> options, IServiceScopeFactory scopeFactory, ILogger<PollingUpdateStrategyBackgroundService> logger)
  {
    _options = options;
    _scopeFactory = scopeFactory;
    _logger = logger;
  }

  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
  {
    _logger.LogInformation("Polling Update Strategy Background Service running.");

    // When the timer should have no due-time, then do the work once now.
    await UpdateState(stoppingToken);

#if NET6_0_OR_GREATER
    using var timer = new PeriodicTimer(_options.Value.MaxAge);
    async Task<bool> WaitForNextTickAsync(CancellationToken cancellation) => await timer.WaitForNextTickAsync(stoppingToken);
#else
    var stopwatch = System.Diagnostics.Stopwatch.StartNew();
    async Task<bool> WaitForNextTickAsync(CancellationToken cancellation)
    {
      try
      {
        var elapsedFraction = stopwatch.Elapsed.Ticks % _options.Value.MaxAge.Ticks;
        var delayFor = _options.Value.MaxAge - TimeSpan.FromTicks(elapsedFraction);
        await Task.Delay(delayFor, cancellation);
        stopwatch.Restart();
        return true;
      }
      catch ( TaskCanceledException e )
      {
        throw new OperationCanceledException(null, e, cancellation);
      }
    }
#endif

    try
    {
      while (await WaitForNextTickAsync(stoppingToken))
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
      using var scope = _scopeFactory.CreateScope();
      var featureBoardHttpClient = scope.ServiceProvider.GetRequiredService<IFeatureBoardHttpClient>();
      var state = scope.ServiceProvider.GetRequiredService<IFeatureBoardState>();
      var (features, lastModified) = await featureBoardHttpClient.FetchUpdates(state.ETag, cancellationToken);
      if (_initialised)
      {
        _logger.LogDebug("Updating State");
        await state.UpdateState(features, lastModified ?? state.ETag, cancellationToken);
        return;
      }

      _logger.LogDebug("Initialising State");
      await state.InitialiseState(features, lastModified ?? state.ETag, cancellationToken);
      _initialised = true;
    }
    catch (Exception exception)
    {
      // Unhandled errors will cause the background service to restart the app
      _logger.LogError(exception, "Error occurred calling UpdateState in (PollingUpdateStrategyBackgroundService) message: {message}", exception.Message);
    }
  }
}
