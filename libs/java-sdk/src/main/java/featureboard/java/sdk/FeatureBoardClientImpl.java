package featureboard.java.sdk;

import com.fasterxml.jackson.annotation.JsonValue;
import com.fasterxml.jackson.databind.JsonNode;
import featureboard.java.sdk.interfaces.AudienceProvider;
import featureboard.java.sdk.interfaces.FeatureBoardClient;
import featureboard.java.sdk.interfaces.FeatureBoardState;
import featureboard.java.sdk.models.AudienceExceptionValue;
import featureboard.java.sdk.state.FeatureBoardStateSnapshot;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

// TODO: ensure the state is fixed for the lifecycle of the request
@Service
public class FeatureBoardClientImpl implements FeatureBoardClient {

  @Autowired
  private final FeatureBoardState globalState;
  @Autowired
  private FeatureBoardStateSnapshot _snapshotState;
  @Autowired
  private final AudienceProvider _audienceProvider;
  private final Logger _logger = Logger.getLogger(FeatureBoardClientImpl.class.getName());

  public FeatureBoardClientImpl(FeatureBoardState globalState, AudienceProvider audienceProvider) {
    this.globalState = globalState;
    _audienceProvider = audienceProvider;
  }

  @Override
  public boolean getFeatureValue(String featureKey, boolean defaultValue) {
    var jsonValue = getFeatureConfigurationValue(featureKey);

    return Optional.of(jsonValue != null && jsonValue.asBoolean()).orElse(defaultValue);
  }

  @Override
  public BigDecimal getFeatureValue(String featureKey, BigDecimal defaultValue) {
    var jsonValue = getFeatureConfigurationValue(featureKey);

    if (jsonValue == null) {
      return defaultValue;
    } else {
      return BigDecimal.valueOf(jsonValue.asDouble());
    }
  }

  @Override
  public String getFeatureValue(String featureKey, String defaultValue) {
    var jsonValue = getFeatureConfigurationValue(featureKey);

    return Optional.ofNullable(jsonValue != null ? jsonValue.asText() : null).orElse(defaultValue);
  }

  @Override
  public <TProp extends Enum<TProp>> TProp getFeatureValue(String featureKey, TProp defaultValue) {
    var jsonValue = getFeatureConfigurationValue(featureKey);

    // TODO: fixme
//    return jsonTryGetValueEnum(jsonValue, defaultValue)
    return null;
  }

  @Override
  public void setSnapshot(FeatureBoardStateSnapshot snapshot) {
    _snapshotState = snapshot;
  }

  private JsonNode getFeatureConfigurationValue(String featureKey) {
    // Current issue: jumps right in to fetching state which will be empty
    // Need to ensure state is populated from the get go?

    // check state here, fetch snapshot
    // Just being defensive
    if (_snapshotState == null) {
      _snapshotState = globalState.GetSnapshot();
    }

    var feature = _snapshotState.Get(featureKey);
    if (feature == null) {
      _logger.fine("GetFeatureValue - no value for " + featureKey + " returning user fallback.");
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

    JsonNode value = (audienceException != null) ? audienceException.value() : feature.defaultValue();

    _logger.fine(String.format("GetFeatureConfigurationValue: {audienceExceptionValue: %s, defaultValue: %s, value: %s}", (audienceException != null) ? audienceException.value() : "null", feature.defaultValue(), value));
    return value;
  }

  // TODO: do I need this?
  private static <T extends Enum<T>> Optional<T> jsonTryGetValueEnum(JsonValue jsonValue, Class<T> enumType) {
    try {
      T enumValue = Enum.valueOf(enumType, jsonValue.toString().toUpperCase());
      return Optional.of(enumValue);
    } catch (IllegalArgumentException e) {
      return Optional.empty();
    }
  }
}
