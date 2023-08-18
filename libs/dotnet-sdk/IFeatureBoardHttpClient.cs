namespace FeatureBoard.DotnetSdk;

public interface IFeatureBoardHttpClient
{
  /// <summary>
  /// Request Feature Configuraiton be updated from FeatureBoard API
  /// </summary>
  /// <param name="cancellationToken">Cancellation token to abort asyncronous processing</param>
  /// <returns><c>true</c> if refresh occurs, <c>false</c> if no refresh is needed or <c>null</c> if an error ocurrs</returns>
  Task<bool?> RefreshFeatureConfiguration(CancellationToken cancellationToken);
}
