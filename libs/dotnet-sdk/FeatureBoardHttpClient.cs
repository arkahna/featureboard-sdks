using FeatureBoard.DotnetSdk.Models;
using Microsoft.Extensions.Logging;
using System.Net;
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

  public async Task<(List<FeatureConfiguration>? features, DateTimeOffset? lastModified)> FetchUpdates(DateTimeOffset? lastModified, CancellationToken cancellationToken)
  {
    using var request = new HttpRequestMessage(HttpMethod.Get, "all");
    request.Headers.IfModifiedSince = lastModified;

    using var response = await _httpClient.SendAsync(request, cancellationToken);

    if (response.StatusCode == HttpStatusCode.NotModified)
    {
      _logger.LogDebug("No changes");
      return (null, lastModified);
    }

    if (response.IsSuccessStatusCode)
    {
      var features = await response.Content.ReadFromJsonAsync<List<FeatureConfiguration>>(cancellationToken: cancellationToken)
                     ?? throw new ApplicationException("Unable to retrieve decode response content");

      lastModified = response.Content.Headers.LastModified ?? lastModified; // if didn't get last-modified header just report previous last modified

      _logger.LogDebug("Fetching updates done, newLastModified={newLastModified}", lastModified);
      return (features, lastModified);
    }

    _logger.LogError("Failed to get latest toggles: Service returned error {statusCode}({responseBody})", response.StatusCode, await response.Content.ReadAsStringAsync(cancellationToken));
    return (null, lastModified);
  }
}
