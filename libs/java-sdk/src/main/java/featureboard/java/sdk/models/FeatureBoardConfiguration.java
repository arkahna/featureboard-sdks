package featureboard.java.sdk.models;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.time.Duration;

import org.springframework.validation.annotation.Validated;

@Component
@Configuration
@Validated
public class FeatureBoardConfiguration {

  private URI httpEndpoint = URI.create("https://client.featureboard.app");

  @Value("${EnvironmentApiKey}")
  private String environmentApiKey;

  private Duration maxAge = Duration.ofMinutes(1);

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
    return maxAge;
  }

  public void setMaxAge(Duration maxAge) {
    if (maxAge.compareTo(Duration.ofSeconds(1)) >= 0) {
      this.maxAge = maxAge;
    }
  }
}
