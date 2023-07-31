using FeatureBoard.DotnetSdk.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Http.Json;

namespace FeatureBoard.DotnetSdk;

internal class FeatureBoardHttpClient : IFeatureBoardHttpClient
{
  private readonly HttpClient _httpClient;
  private readonly ILogger<FeatureBoardHttpClient> _logger;

  public FeatureBoardHttpClient(HttpClient httpClient, IOptions<FeatureBoardOptions> options, ILogger<FeatureBoardHttpClient> logger)
  {
    _httpClient = httpClient;
    _httpClient.BaseAddress = options.Value.HttpEndpoint;
    _httpClient.DefaultRequestHeaders.Add("x-environment-key", options.Value.EnvironmentApiKey);
    _httpClient.Timeout = TimeSpan.FromMilliseconds(options.Value.MaxAgeMs - 3); //prevent multiple requests running at the same time.

    _logger = logger;
  }

  public async Task<(List<FeatureConfiguration>? features, DateTimeOffset? lastModified)> FetchUpdates(DateTimeOffset? lastModified, CancellationToken cancellationToken)
  {
    var request = new HttpRequestMessage(HttpMethod.Get, "all");
    if (lastModified is not null)
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

      if (response.Content.Headers.LastModified is not null)
        lastModified = response.Content.Headers.LastModified;

      _logger.LogDebug("Fetching updates done, newLastModified={newLastModified}", lastModified);
      return (features, lastModified);
    }

    _logger.LogError("Failed to get latest toggles: Service returned error {statusCode}({responseBody})", response.StatusCode, await response.Content.ReadAsStringAsync(cancellationToken));
    return (null, lastModified);
  }
}
