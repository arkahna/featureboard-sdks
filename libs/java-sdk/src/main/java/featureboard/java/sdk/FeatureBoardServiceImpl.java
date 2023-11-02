package featureboard.java.sdk;

import featureboard.java.sdk.interfaces.FeatureBoardHttpClient;
import featureboard.java.sdk.interfaces.FeatureBoardService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Semaphore;
import java.util.logging.Logger;

@Service
public class FeatureBoardServiceImpl implements FeatureBoardService {

  private static final Logger logger = Logger.getLogger(FeatureBoardServiceImpl.class.getName());

  private final FeatureBoardHttpClient featureBoardHttpClient;

  private final Semaphore semaphore = new Semaphore(1);

  public FeatureBoardServiceImpl(@Qualifier("featureBoardHttpClientImpl")
                                 FeatureBoardHttpClient featureBoardHttpClient) {

    this.featureBoardHttpClient = featureBoardHttpClient;
  }

  @Override
  public CompletableFuture<Boolean> refreshFeatureConfiguration() {
    // Check if we can acquire the semaphore immediately
    if (!semaphore.tryAcquire()) {
      // If not, just abort with null because another request must be in process of refreshing state
      return CompletableFuture.completedFuture(null);
    }

    try {
      // Note: may need to specify the "http" client here
      return featureBoardHttpClient.refreshFeatureConfiguration();
    } catch (Exception e) {
      // TODO: logging
      e.printStackTrace();
      // TODO: do i care?
      return CompletableFuture.completedFuture(null); // Or handle the exception accordingly
    } finally {
      semaphore.release();
    }
  }
}
