using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk;

public interface IFeatureBoardHttpClient
{
  Task<(List<FeatureConfiguration>? features, DateTimeOffset? lastModified)> FetchUpdates(DateTimeOffset? lastModified, CancellationToken cancellationToken);
}
