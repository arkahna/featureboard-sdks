package featureboard.java.sdk;

import featureboard.java.sdk.interfaces.FeatureBoardServiceInterface;
import featureboard.java.sdk.models.FeatureBoardConfiguration;
import featureboard.java.sdk.state.LastCheckedTimeBean;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;
import java.util.logging.Logger;

@Service
public class FeatureBoardLastCheckedServiceImpl implements FeatureBoardServiceInterface {
  private final FeatureBoardServiceImpl innerFeatureBoardService;
  private final FeatureBoardConfiguration configuration;
  private final OffsetDateTime now;
  private final Logger logger;
  private final LastCheckedTimeBean lastCheckedTimeProvider;

  public FeatureBoardLastCheckedServiceImpl(FeatureBoardServiceImpl innerFeatureBoardService, FeatureBoardConfiguration config, Supplier<OffsetDateTime> nowSupplier, LastCheckedTimeBean lastCheckedTimeProvider, Logger logger) {
    this.innerFeatureBoardService = innerFeatureBoardService;
    this.configuration = config;
    this.lastCheckedTimeProvider = lastCheckedTimeProvider;
    this.now = nowSupplier.get();
    this.logger = logger;
  }

  @Override
  public CompletableFuture<Boolean> refreshFeatureConfiguration() {
    OffsetDateTime beforeLastChecked = lastCheckedTimeProvider.getLastCheckedTimeReference().get();
    boolean maxAgeHasExpired = now.isAfter(beforeLastChecked.plus(configuration.getMaxAge()));

    if (!maxAgeHasExpired) {
      logger.info(String.format("Feature Configuration has not reached %s, skipping refresh", configuration.getMaxAge()));
      return CompletableFuture.completedFuture(false);
    }

    return innerFeatureBoardService.refreshFeatureConfiguration().thenApply(result -> {
      if (result != null) {
        updateLastChecked(beforeLastChecked);
      }
      return result;
    });
  }

  // TODO: testme, obviously
  private void updateLastChecked(OffsetDateTime beforeLastChecked) {
    AtomicReference<OffsetDateTime> lastCheckedRef = lastCheckedTimeProvider.getLastCheckedTimeReference();
    OffsetDateTime previousValue = lastCheckedRef.get();
    assert previousValue.equals(beforeLastChecked) : "Last Checked mismatch!";
    lastCheckedRef.set(now);
  }
}
