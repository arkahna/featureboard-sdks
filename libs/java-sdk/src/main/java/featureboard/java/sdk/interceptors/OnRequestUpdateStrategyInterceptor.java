package featureboard.java.sdk.interceptors;


import featureboard.java.sdk.FeatureBoardLastCheckedServiceImpl;
import featureboard.java.sdk.FeatureBoardServiceImpl;
import featureboard.java.sdk.interfaces.FeatureBoardClient;
import featureboard.java.sdk.interfaces.FeatureBoardState;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * AS HTTP interceptor designed to refresh configuration before the processing of any HTTP request. State set
 * here should persist for the lifetime of the request.
 */
@Component
@ConditionalOnProperty(name="featureBoardOptions.updateStrategy", havingValue="onrequest", matchIfMissing = true)
public class OnRequestUpdateStrategyInterceptor implements HandlerInterceptor , InitializingBean {
  // We do specifically want the FeatureBoardServiceImpl here, not FeatureBoardLastCheckedServiceImpl
  @Autowired
  private final FeatureBoardServiceImpl featureBoardService;
  @Autowired
  private final FeatureBoardState featureBoardState;
  @Autowired
  private final FeatureBoardClient featureBoardClient;
  @Autowired
  private final FeatureBoardLastCheckedServiceImpl featureBoardLastCheckedService;

  private static final Logger logger = Logger.getLogger(OnRequestUpdateStrategyInterceptor.class.getName());

  public OnRequestUpdateStrategyInterceptor(FeatureBoardServiceImpl featureBoardService, FeatureBoardState featureBoardState,
                                            FeatureBoardClient featureBoardClient, FeatureBoardLastCheckedServiceImpl featureBoardLastCheckedService) {
    this.featureBoardService = featureBoardService;
    this.featureBoardState = featureBoardState;
    this.featureBoardClient = featureBoardClient;
    this.featureBoardLastCheckedService = featureBoardLastCheckedService;
  }

  /**
   * Before handling any HTTP requests, refresh the configuration. This refresh should only happen if older than the last refresh.
   *
   * @param request current HTTP request
   * @param response current HTTP response
   * @param handler chosen handler to execute, for type and/or instance evaluation
   * @return
   * @throws Exception
   */
  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
    try {
      logger.info("HTTP Interceptor preHandle refreshing Feature Configuration state.");
      // 1. Refresh and set state based on when we last checked it
      featureBoardLastCheckedService.refreshFeatureConfiguration();

      // 2. For the base client set a snapshot
      featureBoardClient.setSnapshot(featureBoardState.GetSnapshot());
    } catch (Exception ex) {
      // TODO: logging tidy up
      logger.severe("Error refreshing Feature Configuration state.");
      logger.severe(ex.getMessage());
    }
    return true;
  }

  /**
   * The intent here is this is executed "on startup" of any container (e.g. Spring Boot)
   *
   * @throws Exception
   */
  @Override
  public void afterPropertiesSet() throws Exception {
    logger.info("Refreshing Feature Configuration state on Startup.");

    try {
      // 1. Refresh and set state with no restrictions
      featureBoardService.refreshFeatureConfiguration();

      // 2. For the base client set a snapshot - this snapshot should live for the period between polling
      featureBoardClient.setSnapshot(featureBoardState.GetSnapshot());
    } catch (Exception e) {
      logger.log(Level.SEVERE,"Error occurred during polling.",e);
    }
  }
}
