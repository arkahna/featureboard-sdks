using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FeatureBoard.DotnetSdk.Models;
using Microsoft.Extensions.Logging;

namespace FeatureBoard.DotnetSdk;

public delegate ref EntityTagHeaderValue? LastETagProvider();


internal sealed class FeatureBoardHttpClient : IFeatureBoardHttpClient
{
  private readonly IOrderedEnumerable<State.IFeatureBoardStateUpdateHandler> _featureConfigurationUpdatedHandlers;

  internal static readonly string Action = "all";

  private LastETagProvider _eTag;

  private readonly HttpClient _httpClient;
  private readonly ILogger _logger;

  public FeatureBoardHttpClient(HttpClient httpClient, LastETagProvider lastModifiedTimeProvider, IEnumerable<State.IFeatureBoardStateUpdateHandler> updateHandlers, ILogger<FeatureBoardHttpClient> logger)
  {
    _httpClient = httpClient;
    _eTag = lastModifiedTimeProvider;
    _logger = logger;
    _featureConfigurationUpdatedHandlers = updateHandlers.OrderByDescending(h => h is State.FeatureBoardStateUpdater); // register state update handlers, ensuring "ours" is always first      
  }

  public async Task<bool?> RefreshFeatureConfiguration(CancellationToken cancellationToken)
  {
    using var request = new HttpRequestMessage(HttpMethod.Get, Action);
    var eTag = _eTag();
    if (null != eTag)
      request.Headers.IfNoneMatch.Add(eTag);

    IReadOnlyCollection<FeatureConfiguration>? features = null;
    try
    {
      using var response = await _httpClient.SendAsync(request, cancellationToken);

      switch (response.StatusCode)
      {
        case HttpStatusCode.NotModified:
          _logger.LogDebug("No changes");
          return false;

        case not HttpStatusCode.OK:
          _logger.LogError("Failed to get latest flags: Service returned error {statusCode}({responseBody})", response.StatusCode, await response.Content.ReadAsStringAsync());
          return null;
      }

      features = await response.Content.ReadFromJsonAsync<List<FeatureConfiguration>>(cancellationToken: cancellationToken)
                      ?? throw new ApplicationException("Unable to retrieve decode response content");

      updateEtagRef(response.Headers.ETag ?? eTag);
      _logger.LogDebug("Fetching updates done, eTag={eTag}", eTag);
    }
    catch (HttpRequestException e)
    {
      _logger.LogError(e, "Failed to get latest flags");
      return null;
    }

    try
    {
      foreach (var handler in _featureConfigurationUpdatedHandlers) // DEBT: find way to use Task.WhenAll but if first task exceptions abort/cancel all others
        await handler.UpdateState(features, cancellationToken);
      return true;
    }
    catch (Exception e) when (e is ArgumentException // eg. thrown due to null or duplicate feature key
                           || e is TaskCanceledException)
    {
      updateEtagRef(eTag); // revert to original eTag since we failed to update featureboard internal state
      _logger.LogError(e, "Failed to update flags");
    }
    catch (Exception e) // all other exceptions just log but assume we at least successfully updated featureboard internal state
    {
      _logger.LogError(e, "Failed to update flags");
    }

    return null;

    void updateEtagRef(EntityTagHeaderValue? responseTag) // Sync method to allow use of eTag ref-local variable
    {
      ref var eTag = ref _eTag();
      eTag = responseTag;
    }
  }
}
