package featureboard.java.sdk;

import com.fasterxml.jackson.annotation.JsonValue;
import com.fasterxml.jackson.databind.ObjectMapper;
import featureboard.java.sdk.interfaces.AudienceProvider;
import featureboard.java.sdk.interfaces.FeatureBoardClient;
import featureboard.java.sdk.models.AudienceExceptionValue;
import featureboard.java.sdk.state.FeatureBoardStateSnapshot;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

@Service
public class FeatureBoardClientImpl implements FeatureBoardClient {

  private final FeatureBoardStateSnapshot _state;
  private final AudienceProvider _audienceProvider;
  private final Logger _logger = Logger.getLogger(FeatureBoardClientImpl.class.getName());
  private final ObjectMapper objectMapper = new ObjectMapper();


  public FeatureBoardClientImpl(FeatureBoardStateSnapshot state, AudienceProvider audienceProvider) {
    _state = state;
    _audienceProvider = audienceProvider;
  }

  @Override
  public boolean GetFeatureValue(String featureKey, boolean defaultValue) {
    var jsonValue = getFeatureConfigurationValue(featureKey);

    return jsonTryGetValueBoolean(jsonValue).orElse(defaultValue);
  }

  @Override
  public BigDecimal GetFeatureValue(String featureKey, BigDecimal defaultValue) {
    var jsonValue = getFeatureConfigurationValue(featureKey);

    return jsonTryGetValueBigDecimal(jsonValue).orElse(defaultValue);
  }

  @Override
  public String GetFeatureValue(String featureKey, String defaultValue) {
    var jsonValue = getFeatureConfigurationValue(featureKey);

    return jsonTryGetValueString(jsonValue).orElse(defaultValue);
  }

  @Override
  public <TProp extends Enum<TProp>> TProp GetFeatureValue(String featureKey, TProp defaultValue) {
    var jsonValue = getFeatureConfigurationValue(featureKey);

    // TODO: fixme
//    return jsonTryGetValueEnum(jsonValue, defaultValue)
    return null;
  }

  private JsonValue getFeatureConfigurationValue(String featureKey) {
    var feature = _state.Get(featureKey);
    if (feature == null) {
      _logger.fine("GetFeatureValue - no value, returning user fallback.");
      return null;
    }

    List<String> audienceKeys = _audienceProvider.getAudienceKeys();
    AudienceExceptionValue audienceException = null;

    for (var a : feature.audienceExceptions()) {
      if (audienceKeys.contains(a.audienceKey())) {
        audienceException = a;
        break;
      }
    }

    // TODO: Check this String.valueOf
    JsonValue value = (audienceException != null) ? audienceException.value() : feature.defaultValue();

    _logger.fine(String.format("GetFeatureConfigurationValue: {audienceExceptionValue: %s, defaultValue: %s, value: %s}", (audienceException != null) ? audienceException.value() : "null", feature.defaultValue(), value));
    return value;
  }

  private Optional<Boolean> jsonTryGetValueBoolean(JsonValue jsonValue) {
    return Optional.ofNullable(objectMapper.convertValue(jsonValue, Boolean.class));
  }

  private Optional<BigDecimal> jsonTryGetValueBigDecimal(JsonValue jsonValue) {
    return Optional.ofNullable(objectMapper.convertValue(jsonValue, BigDecimal.class));
  }

  private Optional<String> jsonTryGetValueString(JsonValue jsonValue) {
    return Optional.ofNullable(objectMapper.convertValue(jsonValue, String.class));
  }

  private static <T extends Enum<T>> Optional<T> jsonTryGetValueEnum(JsonValue jsonValue, Class<T> enumType) {
    try {
      T enumValue = Enum.valueOf(enumType, jsonValue.toString().toUpperCase());
      return Optional.of(enumValue);
    } catch (IllegalArgumentException e) {
      return Optional.empty();
    }
  }
}
