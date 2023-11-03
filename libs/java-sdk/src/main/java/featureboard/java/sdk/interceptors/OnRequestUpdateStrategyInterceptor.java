package featureboard.java.sdk.interceptors;


import featureboard.java.sdk.FeatureBoardServiceImpl;
import featureboard.java.sdk.interfaces.FeatureBoardClient;
import featureboard.java.sdk.interfaces.FeatureBoardState;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.logging.Logger;

@Component
@ConditionalOnProperty(name="updateStrategy", havingValue="onrequest", matchIfMissing = true)
public class OnRequestUpdateStrategyInterceptor implements HandlerInterceptor {
  // We do specifically want the FeatureBoardServiceImpl here, not FeatureBoardLastCheckedServiceImpl
  @Autowired
  private final FeatureBoardServiceImpl featureBoardService;
  @Autowired
  private final FeatureBoardState featureBoardState;

  @Autowired
  private final FeatureBoardClient featureBoardClient;
  private static final Logger logger = Logger.getLogger(OnRequestUpdateStrategyInterceptor.class.getName());

  public OnRequestUpdateStrategyInterceptor(FeatureBoardServiceImpl featureBoardService, FeatureBoardState featureBoardState, FeatureBoardClient featureBoardClient) {
    this.featureBoardService = featureBoardService;
    this.featureBoardState = featureBoardState;
    this.featureBoardClient = featureBoardClient;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
    try {
      logger.info("HTTP Interceptor preHandle refreshing Feature Configuration state.");
      // 1. Refresh and set state
      featureBoardService.refreshFeatureConfiguration();

      // 2. For the base client set a snapshot
      featureBoardClient.setSnapshot(featureBoardState.GetSnapshot());
    } catch (Exception ex) {
      // TODO: logging tidy up
      logger.severe("Error refreshing Feature Configuration state.");
      logger.severe(ex.getMessage());
    }
    return true;
  }
}
