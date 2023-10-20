package featureboard.java.sdk.interceptors;


import featureboard.java.sdk.interfaces.FeatureBoardServiceInterface;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.logging.Logger;


@Component
public class OnRequestUpdateStrategyInterceptor implements HandlerInterceptor {

  private final FeatureBoardServiceInterface featureBoardService;
  private final Logger logger;

  public OnRequestUpdateStrategyInterceptor(FeatureBoardServiceInterface featureBoardService, Logger logger) {
    this.featureBoardService = featureBoardService;
    this.logger = logger;
  }

  // Note: no override? this is odd
  public boolean preHandle(ServletServerHttpRequest request, ServletServerHttpResponse response, Object handler) {
    try {
      // Note: the .net version will context.RequestAborted here - we are not. Implications of this?
      featureBoardService.refreshFeatureConfiguration();
    } catch (Exception ex) {
      // TODO: logging
      logger.severe("Error refreshing feature configuration");
      logger.severe(ex.getMessage());
    }
    return true;
  }
}
