using FeatureBoard.DotnetSdk.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FeatureBoard.DotnetSdk;

internal class FeatureBoardService : IFeatureBoardService
{
  private readonly IFeatureBoardHttpClient _httpClient;
  private readonly ILogger _logger;

  private static readonly SemaphoreSlim _semaphore = new(1, 1);

  public FeatureBoardService(IFeatureBoardHttpClient httpClient, ILogger<FeatureBoardService> logger)
  {
    _httpClient = httpClient;
    _logger = logger;
  }

  public virtual async Task<bool?> RefreshFeatureConfiguration(CancellationToken cancellationToken)
  {
    {
      if (!await _semaphore.WaitAsync(TimeSpan.Zero, cancellationToken)) // Check if can acquire the semaphore immediately 
        return null; // if not just abort with indeterminate status because another request must be in process of refreshing state

      try
      {
        return await _httpClient.RefreshFeatureConfiguration(cancellationToken);
      }
      finally
      {
        _semaphore.Release();
      }
    }
  }
}
