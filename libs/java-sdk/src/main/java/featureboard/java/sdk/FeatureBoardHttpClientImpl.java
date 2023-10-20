package featureboard.java.sdk;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import featureboard.java.sdk.interfaces.FeatureBoardHttpClient;
import featureboard.java.sdk.models.FeatureValue;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;
import java.util.logging.Logger;

@Service
public class FeatureBoardHttpClientImpl implements FeatureBoardHttpClient {

  private static final String ACTION = "all";

  private final HttpClient httpClient;
  // Configured by spring down the line, TODO: check this supposition
//  private final ShallowEtagHeaderFilter eTagProvider;
  private final Consumer<List<FeatureValue>> processResult;
  private final Logger _logger;
  private final ObjectMapper objectMapper = new ObjectMapper();


  public FeatureBoardHttpClientImpl(HttpClient httpClient,
                                    Consumer<List<FeatureValue>> processResult, Logger logger) {
    this.httpClient = httpClient;
//    this.eTagProvider = eTagProvider;
    this.processResult = processResult;
    _logger = logger;
  }


  @Override
  public CompletableFuture<Boolean> refreshFeatureConfiguration() {
    var requestBuilder = HttpRequest.newBuilder()
      .GET()
      .uri(URI.create(ACTION));

//    var eTag = eTagProvider.getETag();
//    if (eTag != null) {
//      requestBuilder.header("If-None-Match", eTag);
//    }

    var request = requestBuilder.build();

    return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
      .thenApply(response -> {
        int statusCode = response.statusCode();
        if (statusCode == 304) { // Not Modified
          return false;
        } else if (statusCode != 200) {
          _logger.severe("Failed to get latest toggles: Service returned error {" + statusCode + "} + ({" + response.body() + "})");
          // TODO: probably should be false
          return null;
        } else {

          List<FeatureValue> featureValues = fromJSON(new TypeReference<>() {
          }, response.body());

          processResult.accept(featureValues);
          // TODO: fixme, handle etag
//          String responseETag = response.headers().firstValue("ETag").orElse(null);
//          eTagProvider.updateETag(responseETag);
//          logger.debug("Fetching updates done, eTag={}", eTagProvider.getETag());

          return true;
        }
      });
  }

  // https://stackoverflow.com/questions/9829403/deserialize-json-to-arraylistpojo-using-jackson
  // safer List deserialisation I hope
  public static <T> T fromJSON(final TypeReference<T> type, final String jsonPacket) {
    T data = null;
    try {
      data = new ObjectMapper().readValue(jsonPacket, type);
    } catch (Exception e) {
      // Handle the problem
      // TODO: fixme, tidy up
      throw new RuntimeException(e);
    }
    return data;
  }
}
