using FeatureBoard.DotnetSdk.Models;
using System.Linq.Expressions;

namespace FeatureBoard.DotnetSdk;

public interface IFeatureBoardClient<TFeatures> where TFeatures : IFeatures
{
  TProp GetFeatureValue<TProp>(Expression<Func<TFeatures, TProp>> func, TProp defaultValue);
}