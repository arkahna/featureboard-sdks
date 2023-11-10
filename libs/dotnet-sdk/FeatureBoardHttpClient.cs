using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using FeatureBoard.DotnetSdk.Models;
using System.Net.Http.Headers;

namespace FeatureBoard.DotnetSdk;

public delegate ref EntityTagHeaderValue? LastETagProvider();

internal sealed class FeatureBoardHttpClient : IFeatureBoardHttpClient
{
  internal static readonly string Action = "all";

  private LastETagProvider _eTag;
  private readonly HttpClient _httpClient;
  private readonly Action<IReadOnlyCollection<FeatureConfiguration>> _processResult;
  private readonly ILogger _logger;


  public FeatureBoardHttpClient(HttpClient httpClient, LastETagProvider lastModifiedTimeProvider, Action<IReadOnlyCollection<FeatureConfiguration>> processResult, ILogger<FeatureBoardHttpClient> logger)
  {
    _httpClient = httpClient;
    _processResult = processResult;
    _logger = logger;
    _eTag = lastModifiedTimeProvider;
  }

  public async Task<bool?> RefreshFeatureConfiguration(CancellationToken cancellationToken)
  {
    using var request = new HttpRequestMessage(HttpMethod.Get, Action);
    var eTag = _eTag();
    if (null != eTag)
      request.Headers.IfNoneMatch.Add(eTag);

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

    var features = await response.Content.ReadFromJsonAsync<List<FeatureConfiguration>>(cancellationToken: cancellationToken)
                    ?? throw new ApplicationException("Unable to retrieve decode response content");

    _processResult(features);
    updateEtagRef(response.Headers.ETag);

    void updateEtagRef(EntityTagHeaderValue? responseTag) // Sync method to allow use of eTag ref-local variable
    {
      ref var eTag = ref _eTag();
      eTag = responseTag ?? eTag; // if didn't get eTag just retain previous eTag
      _logger.LogDebug("Fetching updates done, eTag={eTag}", _eTag);
    }

    return true;
  }
}
