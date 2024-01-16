package featureboard.java.sdk.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.Semaphore;

@Configuration
public class SemaphoreConfiguration {
  @Bean
  public Semaphore semaphore() {
    return new Semaphore(1);
  }
}
