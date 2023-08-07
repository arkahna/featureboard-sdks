using FeatureBoard.DotnetSdk.Models;
using System.Linq.Expressions;

namespace FeatureBoard.DotnetSdk;

public interface IFeatureBoardClient<TFeatures> : IFeatureBoardClient where TFeatures : IFeatures
{
  bool GetFeatureValue(Expression<Func<TFeatures, bool>> expr, bool defaultValue);

  decimal GetFeatureValue(Expression<Func<TFeatures, decimal>> expr, decimal defaultValue);

  string GetFeatureValue(Expression<Func<TFeatures, string>> expr, string defaultValue);

  TProp GetFeatureValue<TProp>(Expression<Func<TFeatures, TProp>> func, TProp defaultValue) where TProp : struct, Enum;
}

public interface IFeatureBoardClient
{
  internal bool GetFeatureValue(string featureKey, bool defaultValue);

  internal decimal GetFeatureValue(string featureKey, decimal defaultValue);

  internal string GetFeatureValue(string featureKey, string defaultValue);

  internal TProp GetFeatureValue<TProp>(string featureKey, TProp defaultValue) where TProp : struct, Enum;
}
