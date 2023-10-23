package featureboard.java.sdk.cron;

import featureboard.java.sdk.FeatureBoardServiceImpl;
import featureboard.java.sdk.models.FeatureBoardConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.logging.Level;
import java.util.logging.Logger;

@Service
@EnableScheduling
public class PollingUpdateStrategyBackgroundService {

  // TODO: public or private? weird
  @Autowired
  public final FeatureBoardServiceImpl featureBoardService;

  @Autowired
  private ApplicationContext context;

  @Autowired
  private final FeatureBoardConfiguration configuration;

  private static final Logger logger = Logger.getLogger(PollingUpdateStrategyBackgroundService.class.getName());

  // Note: specifying an impl here
  public PollingUpdateStrategyBackgroundService(FeatureBoardConfiguration configuration, FeatureBoardServiceImpl featureBoardService) {
    this.configuration = configuration;
    this.featureBoardService = featureBoardService;
  }

  // Note: reference value from Spring name directly - not from autowired instance in this class
  @Scheduled(fixedDelayString = "#{featureBoardConfiguration.getMaxAge().toMillis()}")
  public void pollingUpdate() {
    logger.info("Polling Update Strategy Background Service running.");
    logger.info(configuration.environmentApiKey);

    try {
      featureBoardService.refreshFeatureConfiguration();
    } catch (Exception e) {
      logger.log(Level.SEVERE,"Error occurred during polling.",e);
    }
  }
}
