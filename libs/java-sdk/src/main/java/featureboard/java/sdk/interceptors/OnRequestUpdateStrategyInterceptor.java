package featureboard.java.sdk.interceptors;


import featureboard.java.sdk.FeatureBoardServiceImpl;
import featureboard.java.sdk.interfaces.FeatureBoardService;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.logging.Logger;


@Component
public class OnRequestUpdateStrategyInterceptor implements HandlerInterceptor {
  // We do specifically want the FeatureBoardServiceImpl here, not FeatureBoardLastCheckedServiceImpl
  private final FeatureBoardServiceImpl featureBoardService;
  private static final Logger logger = Logger.getLogger(OnRequestUpdateStrategyInterceptor.class.getName());

  public OnRequestUpdateStrategyInterceptor(FeatureBoardServiceImpl featureBoardService) {
    this.featureBoardService = featureBoardService;
  }

  // Note: no override? this is odd
  public boolean preHandle(ServletServerHttpRequest request, ServletServerHttpResponse response, Object handler) {
    try {
      // Note: the .net version will context.RequestAborted here - we are not. Implications of this?
      featureBoardService.refreshFeatureConfiguration();
    } catch (Exception ex) {
      // TODO: logging tidy up
      logger.severe("Error refreshing feature configuration");
      logger.severe(ex.getMessage());
    }
    return true;
  }
}
