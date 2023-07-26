using FeatureBoard.DotnetSdk.Models;
using System.Linq.Expressions;

namespace FeatureBoard.DotnetSdk;

public interface IFeatureBoardClient<TFeatures> : IFeatureBoardClient where TFeatures : IFeatures
{
  TProp GetFeatureValue<TProp>(Expression<Func<TFeatures, TProp>> func, TProp defaultValue);
}

public interface IFeatureBoardClient
{
  internal TProp GetFeatureValue<TProp>(string featureKey, TProp defaultValue);
}
