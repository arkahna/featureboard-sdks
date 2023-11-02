package featureboard.java.sdk;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import featureboard.java.sdk.http.HttpRequestBuilder;
import featureboard.java.sdk.interfaces.FeatureBoardHttpClient;
import featureboard.java.sdk.interfaces.FeatureBoardState;
import featureboard.java.sdk.models.FeatureValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;
import java.util.logging.Logger;

@Service
public class FeatureBoardHttpClientImpl implements FeatureBoardHttpClient {

  private final HttpClient httpClient;

  // Configured by spring down the line, TODO: check this supposition
//  private final ShallowEtagHeaderFilter eTagProvider;
  private Consumer<List<FeatureValue>> processResult;
  private final Logger _logger = Logger.getLogger(FeatureBoardHttpClientImpl.class.getName());
  private final ObjectMapper objectMapper;

  @Autowired
  private final HttpRequestBuilder httpRequestBuilder;

  @Autowired
  private final FeatureBoardState featureBoardState;

  public FeatureBoardHttpClientImpl(HttpRequestBuilder httpRequestBuilder, FeatureBoardState featureBoardState) {
    this.featureBoardState = featureBoardState;
    this.httpClient = HttpClient.newBuilder().build();
    // TODO: fix etag work
//    this.eTagProvider = eTagProvider;
    this.httpRequestBuilder = httpRequestBuilder;

    objectMapper = new ObjectMapper();
    objectMapper.configure(DeserializationFeature.ACCEPT_EMPTY_ARRAY_AS_NULL_OBJECT, true);
  }

  /**
   * Will refresh all Configuration via a HTTP call
   *
   * @return True if new Configuration is found for a refresh, else False if nothing modified
   */
  @Override
  public CompletableFuture<Boolean> refreshFeatureConfiguration() {
    var request = httpRequestBuilder.create("all");

    return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
      .thenApply(response -> {
        int statusCode = response.statusCode();
        if (statusCode == 304) { // Not Modified
          return false;
        } else if (statusCode != 200) {
          _logger.severe("Failed to get latest toggles: Service returned error {" + statusCode + "} + ({" + response.body() + "}) to the following URI: " + response.uri());
          // TODO: probably should be false
          return null;
        } else {
          try {
            List<FeatureValue> featureValues = fromJSON(response.body());

            // TODO: fix state updating
            // TODO: assess if this is required
//          processResult.accept(featureValues);
            featureBoardState.update(featureValues);
            // TODO: fixme, handle etag
//          String responseETag = response.headers().firstValue("ETag").orElse(null);
//          eTagProvider.updateETag(responseETag);
//          logger.debug("Fetching updates done, eTag={}", eTagProvider.getETag());
          } catch (Exception e) {
            // TODO: fix logging
            _logger.severe("error refreshing");
            _logger.severe(e.getMessage());
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
      // Handle the problem
      _logger.severe("Unable to map JSON: " + e.getMessage());
      throw new RuntimeException(e);
    }
  }

  public Consumer<List<FeatureValue>> getProcessResult() {
    return processResult;
  }

  public void setProcessResult(Consumer<List<FeatureValue>> processResult) {
    this.processResult = processResult;
  }
}
