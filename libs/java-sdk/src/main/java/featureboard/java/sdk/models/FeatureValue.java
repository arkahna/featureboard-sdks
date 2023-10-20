package featureboard.java.sdk.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;

public record FeatureValue(
  @JsonProperty("featureKey") String featureKey,
  @JsonProperty("defaultValue") JsonValue defaultValue,
  @JsonProperty("audienceExceptions") AudienceExceptionValue[] audienceExceptions
) {
  @Override
  public String featureKey() {
    return featureKey;
  }

  @Override
  public JsonValue defaultValue() {
    return defaultValue;
  }

  @Override
  public AudienceExceptionValue[] audienceExceptions() {
    return audienceExceptions;
  }
}
