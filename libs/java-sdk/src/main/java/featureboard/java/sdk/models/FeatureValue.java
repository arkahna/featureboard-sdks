package featureboard.java.sdk.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.Collections;
import java.util.List;

public record FeatureValue(
  @JsonProperty("featureKey") String featureKey,
  @JsonProperty("defaultValue") JsonNode defaultValue,
  @JsonProperty("audienceExceptions") List<AudienceExceptionValue> audienceExceptions
) {
  @JsonCreator
  public FeatureValue(
    @JsonProperty("featureKey") String featureKey,
    @JsonProperty("defaultValue") JsonNode defaultValue,
    @JsonProperty("audienceExceptions")
    List<AudienceExceptionValue> audienceExceptions
  ) {
    this.featureKey = featureKey;
    this.defaultValue = defaultValue;
    this.audienceExceptions = audienceExceptions == null ? Collections.emptyList() : audienceExceptions;
  }

  @Override
  public String featureKey() {
    return featureKey;
  }

  @Override
  public JsonNode defaultValue() {
    return defaultValue;
  }

  @Override
  @JsonSetter(nulls = Nulls.AS_EMPTY)
  public List<AudienceExceptionValue> audienceExceptions() {
    return audienceExceptions;
  }
}
