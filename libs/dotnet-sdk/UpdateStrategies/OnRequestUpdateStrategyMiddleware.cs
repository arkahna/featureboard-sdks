using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.State;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FeatureBoard.DotnetSdk.UpdateStrategies;

public class OnRequestUpdateStrategyMiddleware : IMiddleware
{
  private readonly IFeatureBoardState _state;
  private readonly IOptions<FeatureBoardOptions> _options;
  private readonly IFeatureBoardHttpClient _featureBoardHttpClient;
  private readonly ILogger<OnRequestUpdateStrategyMiddleware> _logger;
  private static readonly SemaphoreSlim _semaphore = new(1, 1);

  public OnRequestUpdateStrategyMiddleware(IFeatureBoardState state, IOptions<FeatureBoardOptions> options, IFeatureBoardHttpClient featureBoardHttpClient, ILogger<OnRequestUpdateStrategyMiddleware> logger)
  {
    _state = state;
    _options = options;
    _featureBoardHttpClient = featureBoardHttpClient;
    _logger = logger;
  }

  public async Task InvokeAsync(HttpContext context, RequestDelegate next)
  {
    await UpdateWhenExpired(context.RequestAborted);
    await next(context);
  }

  private async Task InitialiseState(CancellationToken cancellationToken)
  {
    if (_state.LastUpdated is null)
    {
      await _semaphore.WaitAsync(cancellationToken);
      try
      {
        if (_state.LastUpdated is not null)
          return;

        _logger.LogDebug("State not initialised updating state");
        var (features, eTag) =
          await _featureBoardHttpClient.FetchUpdates(_state.ETag, cancellationToken);
        await _state.InitialiseState(features, eTag ?? _state.ETag, cancellationToken);
      }
      finally
      {
        _semaphore.Release();
      }
    }
  }

  private async Task UpdateWhenExpired(CancellationToken cancellationToken)
  {

    if (_state.LastUpdated is null)
    {
      await InitialiseState(cancellationToken);
      return;
    }

    var now = DateTime.UtcNow;
    var expires = _state.LastUpdated + _options.Value.MaxAge;
    if (_state.LastUpdated is null || expires < now)
    {
      if (_state.LastUpdated is not null && _semaphore.CurrentCount == 0)
      {
        // If we have a previous response and the thread is locked lets return that rather than wait for the update
        _logger.LogDebug("Response expired but been updated by another thread: {{maxAge: {maxAge}, expires: {expires}}}", _options.Value.MaxAge, expires);
        return;
      }
      await _semaphore.WaitAsync(cancellationToken);
      try
      {
        expires = _state.LastUpdated + _options.Value.MaxAge;
        if (_state.LastUpdated is not null && expires >= now)
        {
          _logger.LogDebug("Response not expired: {{maxAge: {maxAge}, expires: {expires}}}", _options.Value.MaxAge, expires);
          return;
        }

        _logger.LogDebug("Response expired, fetching updates: {{maxAge: {maxAge}, newExpiry: {newExpiry}}}", _options.Value.MaxAge, now + _options.Value.MaxAge);
        var (features, lastModified) = await _featureBoardHttpClient.FetchUpdates(_state.ETag, cancellationToken);
        await _state.UpdateState(features, lastModified ?? _state.ETag, cancellationToken);
      }
      finally
      {
        _semaphore.Release();
      }
      return;
    }

    _logger.LogDebug("Response not expired: {{maxAge: {maxAge}, expires: {expires}}}", _options.Value.MaxAge, expires);
  }
}
