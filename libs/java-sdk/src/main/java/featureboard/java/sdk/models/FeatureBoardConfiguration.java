package featureboard.java.sdk.models;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import java.net.URI;
import java.time.Duration;

@Configuration
@Validated
public class FeatureBoardConfiguration {

  public URI httpEndpoint = URI.create("https://client.featureboard.app");

  @Value("${featureBoardOptions.environmentApiKey}")
  public String environmentApiKey;

  @Value("${maxAge:60}")
  public int maxAge;

  @Value("${featureBoardOptions.updateStrategy}")
  public String updateStrategy;

  public URI getHttpEndpoint() {
    return httpEndpoint;
  }

  public void setHttpEndpoint(URI httpEndpoint) {
    this.httpEndpoint = httpEndpoint;
  }

  public String getEnvironmentApiKey() {
    return environmentApiKey;
  }

  public void setEnvironmentApiKey(String environmentApiKey) {
    this.environmentApiKey = environmentApiKey;
  }

  public Duration getMaxAge() {
    return Duration.ofSeconds(maxAge);
  }

  public void setMaxAge(int maxAge) {
    // Max age shouldn't be less than one second
      this.maxAge = Math.min(maxAge, 1);
  }
}
