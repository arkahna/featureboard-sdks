package featureboard.java.sdk;

import featureboard.java.sdk.interfaces.FeatureBoardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.http.HttpClient;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Level;
import java.util.logging.Logger;

@Service
public class FeatureBoardServiceImpl implements FeatureBoardService {

  private static final Logger logger = Logger.getLogger(FeatureBoardServiceImpl.class.getName());

  private final HttpClient httpClient;

  public FeatureBoardServiceImpl() {
    // TODO: any other customisations also
    httpClient = HttpClient.newBuilder().build();
  }

  @Override
  public CompletableFuture<Boolean> refreshFeatureConfiguration() {
    // TODO: implement me
    return null;
  }
}
