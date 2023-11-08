package featureboard.java.sdk.cron;

import featureboard.java.sdk.FeatureBoardServiceImpl;
import featureboard.java.sdk.interfaces.FeatureBoardClient;
import featureboard.java.sdk.interfaces.FeatureBoardService;
import featureboard.java.sdk.interfaces.FeatureBoardState;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Refresh the configuration state by a fixed delay (e.g. every 60 seconds).
 */
@Service
@EnableScheduling
@ConditionalOnProperty(name = "featureBoardOptions.updateStrategy", havingValue = "polling", matchIfMissing = false)
public class PollingUpdateStrategyBackgroundService implements InitializingBean {

  @Autowired
  @Qualifier("featureBoardServiceImpl")
  public final FeatureBoardService featureBoardService;
  @Autowired
  private final FeatureBoardState featureBoardState;
  @Autowired
  private final FeatureBoardClient featureBoardClient;
  private static final Logger logger = Logger.getLogger(PollingUpdateStrategyBackgroundService.class.getName());

  // TODO: ensure the client used has no web request dep
  public PollingUpdateStrategyBackgroundService(FeatureBoardServiceImpl featureBoardService, FeatureBoardState featureBoardState,
                                                FeatureBoardClient featureBoardClient) {
    this.featureBoardService = featureBoardService;
    this.featureBoardState = featureBoardState;
    this.featureBoardClient = featureBoardClient;
  }

  // Note: reference value from Spring name directly - not from autowired instance in this class
  @Scheduled(fixedDelayString = "#{featureBoardConfiguration.getMaxAge().toMillis()}")
  public void pollingUpdate() {
    logger.info("Refreshing Feature Configuration state on pollingUpdate.");

    refreshFeatureConfiguration();
  }

  /**
   * The intent here is this is executed "on startup" of any container (e.g. Spring Boot)
   *
   * @throws Exception
   */
  @Override
  public void afterPropertiesSet() throws Exception {
    logger.info("Refreshing Feature Configuration state on Startup.");

    refreshFeatureConfiguration();
  }

  private void refreshFeatureConfiguration() {
    try {
      // 1. Refresh and set state
      featureBoardService.refreshFeatureConfiguration();

      // 2. For the base client set a snapshot - this snapshot should live for the period between polling
      featureBoardClient.setSnapshot(featureBoardState.GetSnapshot());
    } catch (Exception e) {
      logger.log(Level.SEVERE, "Error occurred during polling.", e);
    }
  }
}
