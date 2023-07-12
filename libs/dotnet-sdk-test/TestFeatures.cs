using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.Test;

class TestFeatures : IFeatures
{
  public required string StringFeature { get; set; }
  public required decimal NumberFeature { get; set; }
  public required bool BoolFeature { get; set; }
}
