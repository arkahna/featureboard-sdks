package featureboard.java.sdk.http;

import featureboard.java.sdk.config.FeatureBoardConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.http.HttpRequest;

@Component
public class HttpRequestBuilder {

  @Autowired
  private final FeatureBoardConfiguration configuration;

  public HttpRequestBuilder(FeatureBoardConfiguration configuration) {
    this.configuration = configuration;
  }

  /**
   * Create a HttpRequest Builder for a GET with a specific Base URI and requisite auth header.
   *
   * @param path Extra path for the request
   * @return a HttpRequest Builder with preset URI/Header information
   */
  public HttpRequest.Builder createGETBuilder(String path) {
    URI baseUri = configuration.getHttpEndpoint();
    URI fullUri = UriComponentsBuilder.fromUri(baseUri)
      .pathSegment(path)
      .build()
      .toUri();

    return HttpRequest.newBuilder(fullUri)
      .GET()
      .setHeader("x-environment-key", configuration.getEnvironmentApiKey());
  }
}
