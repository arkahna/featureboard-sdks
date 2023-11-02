package featureboard.java.sdk.cron;

import featureboard.java.sdk.FeatureBoardServiceImpl;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.logging.Level;
import java.util.logging.Logger;

@Service
@EnableScheduling
public class PollingUpdateStrategyBackgroundService implements InitializingBean {

  // TODO: public or private? weird
  @Autowired
  public final FeatureBoardServiceImpl featureBoardService;

  @Autowired
  private ApplicationContext context;

  private static final Logger logger = Logger.getLogger(PollingUpdateStrategyBackgroundService.class.getName());

  // Note: specifying an impl here
  public PollingUpdateStrategyBackgroundService(FeatureBoardServiceImpl featureBoardService) {
    this.featureBoardService = featureBoardService;
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
      featureBoardService.refreshFeatureConfiguration();
    } catch (Exception e) {
      logger.log(Level.SEVERE,"Error occurred during polling.",e);
    }
  }
}
