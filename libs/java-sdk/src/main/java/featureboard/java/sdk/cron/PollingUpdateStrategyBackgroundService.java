package featureboard.java.sdk.cron;

import featureboard.java.sdk.interfaces.FeatureBoardServiceInterface;
import featureboard.java.sdk.models.FeatureBoardConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.logging.Level;
import java.util.logging.Logger;

@Service
@EnableScheduling
public class PollingUpdateStrategyBackgroundService {

  private final FeatureBoardConfiguration configuration;

  private final FeatureBoardServiceInterface featureBoardService;

  private final Logger logger;


  public PollingUpdateStrategyBackgroundService(FeatureBoardConfiguration configuration, FeatureBoardServiceInterface featureBoardService, Logger logger) {
    this.configuration = configuration;
    this.featureBoardService = featureBoardService;
    this.logger = logger;
  }

  // TODO: double check this works ok at runtime
  @Scheduled(fixedDelayString = "#{configuration.getMaxAge().toMillis()}")
  public void pollingUpdate() {
    logger.info("Polling Update Strategy Background Service running.");

    try {
      featureBoardService.refreshFeatureConfiguration();
    } catch (Exception e) {
      logger.log(Level.SEVERE,"Error occurred during polling.",e);
    }
  }
}
