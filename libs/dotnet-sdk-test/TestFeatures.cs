using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.Test;

class TestFeatures : IFeatures
{
  public required TestEnum EnumFeature { get; set; }
  public required string StringFeature { get; set; }
  public required decimal NumberFeature { get; set; }
  public required bool BoolFeature { get; set; }
}

internal enum TestEnum
{
  Apple,
  Orange,
  Peach,
  Pear,
  Grape
}
