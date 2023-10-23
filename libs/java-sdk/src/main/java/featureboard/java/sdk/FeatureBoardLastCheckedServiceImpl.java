package featureboard.java.sdk;

import featureboard.java.sdk.interfaces.FeatureBoardService;
import featureboard.java.sdk.interfaces.NowSupplier;
import featureboard.java.sdk.models.FeatureBoardConfiguration;
import featureboard.java.sdk.state.LastCheckedTimeBean;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicReference;
import java.util.logging.Logger;

@Service
public class FeatureBoardLastCheckedServiceImpl implements FeatureBoardService {
  private final FeatureBoardServiceImpl innerFeatureBoardService;
  private final FeatureBoardConfiguration configuration;
  private final NowSupplier nowSupplier;
  private final Logger logger = Logger.getLogger(FeatureBoardLastCheckedServiceImpl.class.getName());
  private final LastCheckedTimeBean lastCheckedTimeProvider;

  // TODO: wire interface instead?
  // TODO: fix nowSupplier with application scoped bean eh
  public FeatureBoardLastCheckedServiceImpl(FeatureBoardServiceImpl innerFeatureBoardService, FeatureBoardConfiguration config,
                                            NowSupplier nowSupplier, LastCheckedTimeBean lastCheckedTimeProvider) {
    this.innerFeatureBoardService = innerFeatureBoardService;
    this.configuration = config;
    this.nowSupplier = nowSupplier;
    this.lastCheckedTimeProvider = lastCheckedTimeProvider;
  }

  @Override
  public CompletableFuture<Boolean> refreshFeatureConfiguration() {
    OffsetDateTime beforeLastChecked = lastCheckedTimeProvider.getLastCheckedTimeReference().get();
    boolean maxAgeHasExpired = nowSupplier.getNow().isAfter(beforeLastChecked.plus(configuration.getMaxAge()));

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
    lastCheckedRef.set(nowSupplier.getNow());
  }
}
