using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using FeatureBoard.DotnetSdk.Models;
using System.Net.Http.Headers;

namespace FeatureBoard.DotnetSdk;

public delegate ref EntityTagHeaderValue? LastETagProvider();
public delegate ref RetryConditionHeaderValue? RetryAfterProvider();

internal sealed class FeatureBoardHttpClient : IFeatureBoardHttpClient
{
  internal static readonly string Action = "all";

  private LastETagProvider _eTag;

  private RetryAfterProvider _retryAfter;
  private readonly HttpClient _httpClient;
  private readonly Action<IReadOnlyCollection<FeatureConfiguration>> _processResult;
  private readonly ILogger _logger;


  public FeatureBoardHttpClient(HttpClient httpClient, LastETagProvider lastModifiedTimeProvider, RetryAfterProvider retryAfterProvider, Action<IReadOnlyCollection<FeatureConfiguration>> processResult, ILogger<FeatureBoardHttpClient> logger)
  {
    _httpClient = httpClient;
    _processResult = processResult;
    _logger = logger;
    _eTag = lastModifiedTimeProvider;
    _retryAfter = retryAfterProvider;
  }

  public async Task<bool?> RefreshFeatureConfiguration(CancellationToken cancellationToken)
  {
    using var request = new HttpRequestMessage(HttpMethod.Get, Action);
    var eTag = _eTag();
    if (null != eTag)
      request.Headers.IfNoneMatch.Add(eTag);

    var retryAfter = _retryAfter();
    if (retryAfter != null && retryAfter.Date > DateTimeOffset.Now)
    {
      // Do not call API
      _logger.LogWarning("Failed to get latest flags. Service returned error 429 (Too Many Requests). Retry after: {retryAfter}", retryAfter.Date.Value.ToString());
      return false;
    }
    using var response = await _httpClient.SendAsync(request, cancellationToken);

    retryAfter = updateRetryAfterRef(response.Headers.RetryAfter);

    switch (response.StatusCode)
    {
      case HttpStatusCode.NotModified:
        _logger.LogDebug("No changes");
        return false;

      //HttpStatusCode.TooManyRequests not defined in .NET Standards 2.0 
      case (HttpStatusCode)429:
        if (response.Headers.RetryAfter == null)
        {
          // No retry after header set, hold back call to client api for 60 seconds
          var retryAfterDate = DateTimeOffset.Now.AddMinutes(1);
          retryAfter = updateRetryAfterRef(new RetryConditionHeaderValue(retryAfterDate));
        }
        _logger.LogWarning("Failed to get latest flags. Service returned error 429 (Too Many Requests). Retry after: {retryAfter}", retryAfter!.Date!.Value.ToString());
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

    RetryConditionHeaderValue? updateRetryAfterRef(RetryConditionHeaderValue? responseRetryAfter) // Sync method to allow use of eTag ref-local variable
    {
      ref var retryAfter = ref _retryAfter();
      if (responseRetryAfter?.Date == null && responseRetryAfter?.Delta != null)
      {
        var retryAfterDate = DateTimeOffset.Now + responseRetryAfter.Delta.Value;
        retryAfter = new RetryConditionHeaderValue(retryAfterDate);
      }
      else
      {
        retryAfter = responseRetryAfter;
      }

      return _retryAfter();
    }

    return true;
  }
}
