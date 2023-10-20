package featureboard.java.sdk.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;

public record AudienceExceptionValue(
  @JsonProperty("audienceKey") String audienceKey,
  @JsonProperty("value") JsonValue value
) {
  // TODO: needed?
  public AudienceExceptionValue() {
    this(null, null);
  }

  @Override
  public String audienceKey() {
    return audienceKey;
  }

  @Override
  public JsonValue value() {
    return value;
  }
}
