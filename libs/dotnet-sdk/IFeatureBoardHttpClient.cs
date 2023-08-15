using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk;

public interface IFeatureBoardHttpClient
{
  Task<(List<FeatureConfiguration>? features, string? eTag)> FetchUpdates(string? eTag, CancellationToken cancellationToken);
}
