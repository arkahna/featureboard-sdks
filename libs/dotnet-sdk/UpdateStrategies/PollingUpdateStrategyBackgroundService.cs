using FeatureBoard.DotnetSdk.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FeatureBoard.DotnetSdk.UpdateStrategies;

public class PollingUpdateStrategyBackgroundService : BackgroundService
{
  private readonly IOptions<FeatureBoardOptions> _options;
  private readonly IServiceScopeFactory _scopeFactory;
  private readonly ILogger _logger;

  public PollingUpdateStrategyBackgroundService(IOptions<FeatureBoardOptions> options, IServiceScopeFactory scopeFactory, ILogger<PollingUpdateStrategyBackgroundService> logger)
  {
    _options = options;
    _scopeFactory = scopeFactory;
    _logger = logger;
  }

  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
  {
    _logger.LogInformation("Polling Update Strategy Background Service running.");

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
        _logger.LogDebug("Elapsed time {0}; Delaying for {1}", stopwatch.Elapsed, delayFor);
        await Task.Delay(delayFor, cancellation);
        stopwatch.Restart();
        return true;
      }
      catch (TaskCanceledException e)
      {
        throw new OperationCanceledException(null, e, cancellation);
      }
    }
#endif

    try
    {
      while (await WaitForNextTickAsync(stoppingToken))
      {
        using var scope = _scopeFactory.CreateScope();
        var featureBoardService = scope.ServiceProvider.GetRequiredService<IFeatureBoardService>();
        await featureBoardService.RefreshFeatureConfiguration(stoppingToken);
      }
    }
    catch (OperationCanceledException)
    {
      _logger.LogInformation("Polling Update Strategy Background Service is stopping.");
    }
  }
}
