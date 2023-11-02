package featureboard.java.sdk.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

public record AudienceExceptionValue(
  @JsonProperty("audienceKey") String audienceKey,
  @JsonProperty("value") JsonNode value
) {
  @JsonCreator
  public AudienceExceptionValue {
  }

  @Override
  public String audienceKey() {
    return audienceKey;
  }

  @Override
  public JsonNode value() {
    return value;
  }
}
