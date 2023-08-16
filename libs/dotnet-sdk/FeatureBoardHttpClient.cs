using FeatureBoard.DotnetSdk.Models;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace FeatureBoard.DotnetSdk;

internal class FeatureBoardHttpClient : IFeatureBoardHttpClient
{
  private readonly HttpClient _httpClient;
  private readonly ILogger _logger;

  public FeatureBoardHttpClient(HttpClient httpClient, ILogger<FeatureBoardHttpClient> logger)
  {
    _httpClient = httpClient;
    _logger = logger;
  }

  public async Task<(List<FeatureConfiguration>? features, string? eTag)> FetchUpdates(string? eTag, CancellationToken cancellationToken)
  {
    using var request = new HttpRequestMessage(HttpMethod.Get, "all");
    if (!string.IsNullOrWhiteSpace(eTag))
      request.Headers.IfNoneMatch.Add(new EntityTagHeaderValue(eTag));

    using var response = await _httpClient.SendAsync(request, cancellationToken);

    if (response.StatusCode == HttpStatusCode.NotModified)
    {
      _logger.LogDebug("No changes");
      return (null, eTag);
    }

    if (response.IsSuccessStatusCode)
    {
      var features = await response.Content.ReadFromJsonAsync<List<FeatureConfiguration>>(cancellationToken: cancellationToken)
                     ?? throw new ApplicationException("Unable to retrieve decode response content");


      eTag = response.Headers.ETag?.Tag ?? eTag; // if didn't get eTag just report previous eTag

      _logger.LogDebug("Fetching updates done, eTag={eTag}", eTag);
      return (features, eTag);
    }

    _logger.LogError("Failed to get latest toggles: Service returned error {statusCode}({responseBody})", response.StatusCode, await response.Content.ReadAsStringAsync());
    return (null, eTag);
  }
}
