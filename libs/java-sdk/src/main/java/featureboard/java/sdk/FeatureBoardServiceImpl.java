package featureboard.java.sdk;

import featureboard.java.sdk.interfaces.FeatureBoardHttpClient;
import featureboard.java.sdk.interfaces.FeatureBoardService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Semaphore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class FeatureBoardServiceImpl implements FeatureBoardService {

  private static final Logger logger = LoggerFactory.getLogger(FeatureBoardServiceImpl.class.getName());

  private final FeatureBoardHttpClient featureBoardHttpClient;

  private final Semaphore semaphore;

  public FeatureBoardServiceImpl(@Qualifier("featureBoardHttpClientImpl")
                                 FeatureBoardHttpClient featureBoardHttpClient, Semaphore semaphore) {

    this.featureBoardHttpClient = featureBoardHttpClient;
    this.semaphore = semaphore;
  }

  @Override
  public CompletableFuture<Boolean> refreshFeatureConfiguration() {
    // Check if we can acquire the semaphore immediately
    if (!semaphore.tryAcquire()) {
      logger.info("Cannot acquire semaphore - another request must be in process of refreshing state.");
      return CompletableFuture.completedFuture(null);
    }

    try {
      return featureBoardHttpClient.refreshFeatureConfiguration();
    } catch (Exception e) {
      logger.error("Unable to refresh configuration: {}", e.getMessage());
      return CompletableFuture.completedFuture(null); // Or handle the exception accordingly
    } finally {
      semaphore.release();
    }
  }
}
