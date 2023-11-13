package featureboard.java.sdk;

import featureboard.java.sdk.interfaces.FeatureBoardService;
import featureboard.java.sdk.models.FeatureBoardConfiguration;
import featureboard.java.sdk.state.LastCheckedTimeProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicReference;
import java.util.logging.Logger;

/**
 * Refreshes the configuration if the configuration state is currently older than maxAge.
 * <br />
 * Designed to be consumed by the OnRequest handler
 *
 */
@Service
public class FeatureBoardLastCheckedServiceImpl implements FeatureBoardService {
  @Autowired
  private final FeatureBoardServiceImpl featureBoardServiceImpl;
  @Autowired
  private final FeatureBoardConfiguration configuration;
  private final Logger logger = Logger.getLogger(FeatureBoardLastCheckedServiceImpl.class.getName());
  @Autowired
  private final LastCheckedTimeProvider lastCheckedTimeProvider;

  public FeatureBoardLastCheckedServiceImpl(FeatureBoardServiceImpl featureBoardServiceImpl, FeatureBoardConfiguration config,
                                            LastCheckedTimeProvider lastCheckedTimeProvider) {
    this.featureBoardServiceImpl = featureBoardServiceImpl;
    this.configuration = config;
    this.lastCheckedTimeProvider = lastCheckedTimeProvider;
  }

  @Override
  public CompletableFuture<Boolean> refreshFeatureConfiguration() {
    OffsetDateTime beforeLastChecked = lastCheckedTimeProvider.getLastCheckedTime();
    boolean maxAgeHasExpired = OffsetDateTime.now().isAfter(beforeLastChecked.plus(configuration.getMaxAge()));

    if (!maxAgeHasExpired) {
      logger.info(String.format("Feature Configuration has not reached %s, skipping refresh", configuration.getMaxAge()));
      return CompletableFuture.completedFuture(false);
    }

    return featureBoardServiceImpl.refreshFeatureConfiguration().thenApply(result -> {
      if (result != null) {
        updateLastChecked(beforeLastChecked);
      }
      return result;
    });
  }

  private void updateLastChecked(OffsetDateTime beforeLastChecked) {
    AtomicReference<OffsetDateTime> lastCheckedRef = lastCheckedTimeProvider.getLastCheckedTimeReference();
    OffsetDateTime previousValue = lastCheckedRef.get();
    assert previousValue.equals(beforeLastChecked) : "Last Checked mismatch!";
    lastCheckedRef.set(OffsetDateTime.now());
  }
}
