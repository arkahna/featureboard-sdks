using FeatureBoard.DotnetSdk.Attributes;
using FeatureBoard.DotnetSdk.Helpers;
using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.State;
using Microsoft.Extensions.Logging;
using System.Linq.Expressions;
using System.Reflection;

namespace FeatureBoard.DotnetSdk;

public class FeatureBoardClient<TFeatures> : IFeatureBoardClient<TFeatures> where TFeatures : class, IFeatures
{
  private readonly FeatureBoardStateSnapshot _state;
  private readonly IAudienceProvider _audienceProvider;
  private readonly ILogger<FeatureBoardClient<TFeatures>> _logger;

  public FeatureBoardClient(IFeatureBoardState state, IAudienceProvider audienceProvider, ILogger<FeatureBoardClient<TFeatures>> logger)
  {
    _audienceProvider = audienceProvider;
    _logger = logger;
    _state = state.GetSnapshot();
  }

  public TProp GetFeatureValue<TProp>(Expression<Func<TFeatures, TProp>> expr, TProp defaultValue)
  {
    if (expr.Body is not MemberExpression memberExpression)
      throw new ArgumentException($"The provided expression contains a {expr.GetType().Name} which is not supported. Only simple member accessors (fields, properties) of an object are supported.");


    var attr = memberExpression.Member.GetCustomAttribute<FeatureKeyNameAttribute>(); //Caching this value offers no performance improvement
    return GetFeatureValue(
      attr?.Name
        ?? memberExpression.Member.Name.ToFeatureBoardKey(), //Pascal to Kebab case
      defaultValue);
  }

  public TProp GetFeatureValue<TProp>(string featureKey, TProp defaultValue)
  {
    var feature = _state.Get(featureKey);
    var audienceKeys = _audienceProvider.AudienceKeys;
    if (feature == null)
    {
      _logger.LogDebug("GetFeatureValue - no value, returning user fallback: {defaultValue}", defaultValue);
      return defaultValue;
    }

    var audienceException = feature.AudienceExceptions.FirstOrDefault(a =>
      audienceKeys.Contains(a.AudienceKey)
    );

    if (typeof(TProp).IsEnum)
    {
      if (!(audienceException?.Value ?? feature.DefaultValue).TryGetValue<string>(out var strValue) || !Enum.TryParse(typeof(TProp), strValue, true, out var enumValue))
      {
        _logger.LogError("The unable to decode the value to the expected type:  {{audienceExceptionValue: {audienceExceptionValue}, defaultValue: {defaultValue}, value: {expectedType}}}", audienceException?.Value, feature.DefaultValue, typeof(TProp).Name);
        return defaultValue;
      }

      return enumValue != null ? (TProp)enumValue : defaultValue;
    }

    if (!(audienceException?.Value ?? feature.DefaultValue).TryGetValue<TProp>(out var value))
    {
      _logger.LogError("The unable to decode the value to the expected type:  {{audienceExceptionValue: {audienceExceptionValue}, defaultValue: {defaultValue}, value: {expectedType}}}", audienceException?.Value, feature.DefaultValue, typeof(TProp).Name);
      return defaultValue;
    }

    _logger.LogDebug("GetFeatureValue: {{audienceExceptionValue: {audienceExceptionValue}, defaultValue: {defaultValue}, value: {value}}}", audienceException?.Value, feature.DefaultValue, value);
    return value;
  }

}
