package featureboard.java.sdk.interceptors;


import featureboard.java.sdk.FeatureBoardServiceImpl;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.logging.Logger;

@Component
public class OnRequestUpdateStrategyInterceptor implements HandlerInterceptor {
  // We do specifically want the FeatureBoardServiceImpl here, not FeatureBoardLastCheckedServiceImpl
  @Autowired
  private final FeatureBoardServiceImpl featureBoardService;
  private static final Logger logger = Logger.getLogger(OnRequestUpdateStrategyInterceptor.class.getName());

  public OnRequestUpdateStrategyInterceptor(FeatureBoardServiceImpl featureBoardService) {
    this.featureBoardService = featureBoardService;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
    try {
      logger.info("HTTP Interceptor preHandle refreshing Feature Configuration state.");
      featureBoardService.refreshFeatureConfiguration();
    } catch (Exception ex) {
      // TODO: logging tidy up
      logger.severe("Error refreshing Feature Configuration state.");
      logger.severe(ex.getMessage());
    }
    return true;
  }
}
