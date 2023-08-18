using FeatureBoard.DotnetSdk.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FeatureBoard.DotnetSdk;

public delegate ref DateTimeOffset LastCheckedTimeProvider();

internal class FeatureBoardLastCheckedService : IFeatureBoardService
{
  private readonly FeatureBoardService _innerFeatureBoardService;
  private readonly IOptions<FeatureBoardOptions> _options;
  private readonly DateTimeOffset _now;
  private readonly ILogger _logger;
  private readonly LastCheckedTimeProvider _lastCheckedTimeProvider;

  public FeatureBoardLastCheckedService(FeatureBoardService innerFeatureBoardService, IOptions<FeatureBoardOptions> options, Func<DateTimeOffset> now, LastCheckedTimeProvider lastCheckedTimeProvider, ILogger<FeatureBoardLastCheckedService> logger)
  {
    _innerFeatureBoardService = innerFeatureBoardService;
    _options = options;
    _lastCheckedTimeProvider = lastCheckedTimeProvider;
    _now = now();
    _logger = logger;
  }

  public virtual async Task<bool?> RefreshFeatureConfiguration(CancellationToken cancellationToken)
  {
    var maxAgeHasExpired = _now > _lastCheckedTimeProvider() + _options.Value.MaxAge;
    if (!maxAgeHasExpired)
    {
      _logger.LogDebug("Feature Configuration has not reached {0}, skipping refresh", _options.Value.MaxAge);
      return false;
    }

    void UpdateLastChecked() // Sync method to allow use of lastChecked ref-local variable
    {
      ref var lastChecked = ref _lastCheckedTimeProvider();
      lastChecked = _now;
    }

    var result = await _innerFeatureBoardService.RefreshFeatureConfiguration(cancellationToken);
    if (null != result)
      UpdateLastChecked();

    return result;
  }
}
