using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk;

public interface IFeatureBoardHttpClient
{
  Task<(Dictionary<string, FeatureConfiguration>? features, DateTimeOffset? lastModified)> FetchUpdates(
    DateTimeOffset? lastModified, CancellationToken cancellationToken);
}
