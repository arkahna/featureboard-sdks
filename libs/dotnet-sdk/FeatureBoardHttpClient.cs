using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FeatureBoard.DotnetSdk.Models;
using Microsoft.Extensions.Logging;

namespace FeatureBoard.DotnetSdk;

public delegate ref EntityTagHeaderValue? LastETagProvider();

public delegate Task FeatureConfigurationUpdated(IReadOnlyCollection<FeatureConfiguration> configuration, CancellationToken cancellationToken);

internal sealed class FeatureBoardHttpClient : IFeatureBoardHttpClient
{
  internal static readonly string Action = "all";

  private LastETagProvider _eTag;
  private readonly HttpClient _httpClient;
  private event FeatureConfigurationUpdated OnFeatureConfigurationUpdated = null!;
  private readonly ILogger _logger;


  public FeatureBoardHttpClient(HttpClient httpClient, LastETagProvider lastModifiedTimeProvider, IEnumerable<FeatureConfigurationUpdated> updateHandlers, ILogger<FeatureBoardHttpClient> logger)
  {
    _httpClient = httpClient;
    foreach (var handler in updateHandlers)
      OnFeatureConfigurationUpdated += handler;
    _logger = logger;
    _eTag = lastModifiedTimeProvider;
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

      updateEtagRef(response.Headers.ETag);
    }
    catch (HttpRequestException e)
    {
      _logger.LogError(e, "Failed to get latest flags");
      return null;
    }

    try
    {
      await OnFeatureConfigurationUpdated(features, cancellationToken);
      return true;
    }
    catch (ArgumentException e) // eg. thrown due to duplicate feature key
    {
      _logger.LogError(e, "Failed to update flags");
      return null;
    }

    void updateEtagRef(EntityTagHeaderValue? responseTag) // Sync method to allow use of eTag ref-local variable
    {
      ref var eTag = ref _eTag();
      eTag = responseTag ?? eTag; // if didn't get eTag just retain previous eTag
      _logger.LogDebug("Fetching updates done, eTag={eTag}", eTag);
    }
  }
}
