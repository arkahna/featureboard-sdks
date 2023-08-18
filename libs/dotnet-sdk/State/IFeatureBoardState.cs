namespace FeatureBoard.DotnetSdk.State;

public interface IFeatureBoardState
{
  FeatureBoardStateSnapshot GetSnapshot();
}
