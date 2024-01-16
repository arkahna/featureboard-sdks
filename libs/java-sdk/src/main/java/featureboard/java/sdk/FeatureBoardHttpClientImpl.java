package featureboard.java.sdk;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import featureboard.java.sdk.http.HttpRequestBuilder;
import featureboard.java.sdk.interfaces.FeatureBoardHttpClient;
import featureboard.java.sdk.interfaces.FeatureBoardState;
import featureboard.java.sdk.models.FeatureValue;
import featureboard.java.sdk.state.ETagState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class FeatureBoardHttpClientImpl implements FeatureBoardHttpClient {

  @Autowired
  private final HttpClient httpClient;
  private final Logger logger = LoggerFactory.getLogger(FeatureBoardHttpClientImpl.class.getName());
  @Autowired
  private final ObjectMapper objectMapper;

  @Autowired
  private final HttpRequestBuilder httpRequestBuilder;
  @Autowired
  private final FeatureBoardState featureBoardState;
  @Autowired
  private final ETagState eTagState;

  public FeatureBoardHttpClientImpl(HttpRequestBuilder httpRequestBuilder, FeatureBoardState featureBoardState, ETagState eTagState, HttpClient httpClient, ObjectMapper objectMapper) {
    this.featureBoardState = featureBoardState;
    this.eTagState = eTagState;
    this.httpClient = httpClient;
    this.httpRequestBuilder = httpRequestBuilder;
    this.objectMapper = objectMapper;
  }

  /**
   * Will refresh all Configuration via a HTTP call to Featureboard.
   *
   * @return True if new Configuration is found for a refresh, else False if nothing is modified
   */
  @Override
  public CompletableFuture<Boolean> refreshFeatureConfiguration() {
    var requestBuilder = httpRequestBuilder.createGETBuilder("all");
    // Check for the existence of an eTag in memory/state
    if (!eTagState.geteTagValue().isEmpty()) {
      requestBuilder.setHeader("If-None-Match", eTagState.geteTagValue());
    }

    return httpClient.sendAsync(requestBuilder.build(), HttpResponse.BodyHandlers.ofString())
      .thenApply(response -> {
        int statusCode = response.statusCode();
        if (statusCode == 304) { // Not Modified
          logger.info("Configuration unchanged - nothing to do.");
          return false;
        } else if (statusCode != 200) {
          logger.error("Failed to get latest toggles: Service returned error {" + statusCode + "} " +
            "+ ({" + response.body() + "}) to the following URI: " + response.uri());
          return null;
        } else {
          try {
            List<FeatureValue> featureValues = fromJSON(response.body());
            featureValues.forEach(featureValue -> logger.info("Updating Feature Value: {}", featureValue.featureKey()));

            // Refresh the GLOBAL state - not the snapshot
            featureBoardState.update(featureValues);
            // Update eTag based on response
            String responseETag = response.headers().firstValue("ETag").orElse(eTagState.geteTagValue());
            eTagState.seteTagValue(responseETag);
          } catch (Exception e) {
            logger.error("Error Refreshing Configuration: {}", e.getMessage());
            return false;
          }

          return true;
        }
      });
  }

  public List<FeatureValue> fromJSON(final String jsonPacket) {
    try {
      return objectMapper.readValue(jsonPacket, new TypeReference<>() {
      });
    } catch (Exception e) {
      logger.error("Unable to map JSON: {} ", e.getMessage());
      throw new RuntimeException(e);
    }
  }
}
