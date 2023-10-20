package featureboard.java.sdk;

import featureboard.java.sdk.interfaces.FeatureBoardServiceInterface;
import org.springframework.stereotype.Service;

import java.net.http.HttpClient;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Logger;

@Service
public class FeatureBoardServiceImpl implements FeatureBoardServiceInterface {

  private final Logger _logger;
  private final HttpClient httpClient;

  public FeatureBoardServiceImpl(Logger logger, HttpClient httpClient) {
    _logger = logger;
    this.httpClient = httpClient;
  }

  @Override
  public CompletableFuture<Boolean> refreshFeatureConfiguration() {
    // TODO: implement me
    return null;
  }
}
