package featureboard.java.sdk;

import featureboard.java.sdk.interceptors.OnRequestUpdateStrategyInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  @Autowired
  private OnRequestUpdateStrategyInterceptor onRequestUpdateStrategyInterceptor;

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    // Run interceptor on all paths
    registry.addInterceptor(onRequestUpdateStrategyInterceptor).addPathPatterns("/**");
  }
}

