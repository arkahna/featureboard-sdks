using FeatureBoard.DotnetSdk.Attributes;
using FeatureBoard.DotnetSdk.Helpers;
using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.State;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text.Json.Nodes;

namespace FeatureBoard.DotnetSdk;

public class FeatureBoardClient<TFeatures> : IFeatureBoardClient<TFeatures> where TFeatures : class, IFeatures
{
  private readonly FeatureBoardStateSnapshot _state;
  private readonly IAudienceProvider _audienceProvider;
  private readonly ILogger _logger;

  public FeatureBoardClient(IFeatureBoardState state, IAudienceProvider audienceProvider, ILogger<FeatureBoardClient<TFeatures>> logger)
  {
    _audienceProvider = audienceProvider;
    _logger = logger;
    _state = state.GetSnapshot();
  }

  public decimal GetFeatureValue(Expression<Func<TFeatures, decimal>> expr, decimal defaultValue)
    => GetFeatureValue(expr, defaultValue, GetFeatureValue);

  public decimal GetFeatureValue(string featureKey, decimal defaultValue)
    => GetFeatureValue(featureKey, defaultValue, JsonTryGetValue);


  public bool GetFeatureValue(Expression<Func<TFeatures, bool>> expr, bool defaultValue)
    => GetFeatureValue(expr, defaultValue, GetFeatureValue);

  public bool GetFeatureValue(string featureKey, bool defaultValue)
    => GetFeatureValue(featureKey, defaultValue, JsonTryGetValue);


  public TProp GetFeatureValue<TProp>(Expression<Func<TFeatures, TProp>> expr, TProp defaultValue) where TProp : struct, Enum
    => GetFeatureValue(expr, defaultValue, GetFeatureValue);

  public TEnum GetFeatureValue<TEnum>(string featureKey, TEnum defaultValue) where TEnum : struct, Enum
  => GetFeatureValue<TEnum>(featureKey, defaultValue, EnumTryParse);


  public string GetFeatureValue(Expression<Func<TFeatures, string>> expr, string defaultValue)
    => GetFeatureValue(expr, defaultValue, GetFeatureValue);

  public string GetFeatureValue(string featureKey, string defaultValue)
  {
    var featureJsonValue = GetFeatureConfigurationValue(featureKey, defaultValue);

    return featureJsonValue?.GetValue<string>() ?? defaultValue;
  }


  private T GetFeatureValue<T>(string featureKey, T defaultValue, FeatureValueParser<T> valueParser)
  {
    var featureJsonValue = GetFeatureConfigurationValue(featureKey, defaultValue?.ToString());
    if (featureJsonValue == null)
      return defaultValue;

    if (valueParser(featureJsonValue, out T value))
      return value;

    _logger.LogError("The unable to decode the value to the expected type: {{computedValue: {computedValue}, value: {expectedType}}}", featureJsonValue, typeof(T).Name);
    return defaultValue;
  }


  private static TProp GetFeatureValue<TProp>(Expression<Func<TFeatures, TProp>> expr, TProp defaultValue, Func<string, TProp, TProp> FeatureValueGetter)
  {
    if (expr.Body is not MemberExpression memberExpression)
      throw new ArgumentException($"The provided expression contains a {expr.GetType().Name} which is not supported. Only simple member accessors (fields, properties) of an object are supported.", nameof(expr));

    var attr = memberExpression.Member.GetCustomAttribute<FeatureKeyNameAttribute>(); //Caching this value offers no performance improvement
    return FeatureValueGetter(
      attr?.Name
        ?? memberExpression.Member.Name.ToFeatureBoardKey(), //Pascal to Kebab case
      defaultValue);
  }


  private JsonValue? GetFeatureConfigurationValue(string featureKey, string? defaultValue)
  {
    var feature = _state.Get(featureKey);
    var audienceKeys = _audienceProvider.AudienceKeys;
    if (feature == null)
    {
      _logger.LogDebug("GetFeatureValue - no value, returning user fallback: {defaultValue}", defaultValue);
      return null;
    }

    var audienceException = feature.AudienceExceptions.FirstOrDefault(a =>
      audienceKeys.Contains(a.AudienceKey)
    );

    var value = audienceException?.Value ?? feature.DefaultValue;

    _logger.LogDebug("GetFeatureConfigurationValue: {{audienceExceptionValue: {audienceExceptionValue}, defaultValue: {defaultValue}, value: {value}}}", audienceException?.Value, feature.DefaultValue, value);
    return value;
  }

  private delegate bool FeatureValueParser<T>(JsonValue inValue, out T value);

  private static bool JsonTryGetValue<T>(JsonValue jsonValue, out T value) where T : struct
    => jsonValue.TryGetValue(out value);

  private static bool EnumTryParse<T>(JsonValue jsonValue, out T value) where T : struct, Enum
    => Enum.TryParse(jsonValue.GetValue<string>(), ignoreCase: true, out value);

}
