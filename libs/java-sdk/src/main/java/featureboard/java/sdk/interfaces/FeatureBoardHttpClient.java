package featureboard.java.sdk.interfaces;

import java.util.concurrent.CompletableFuture;

public interface FeatureBoardHttpClient {

  /**
   * Request Feature Configuration be updated from FeatureBoard API
   *
   * @return Optional.of(true) if refresh occurs, Optional.of(false) if no refresh is needed or Optional.empty() if an error occurs
   */
  CompletableFuture<Boolean> refreshFeatureConfiguration();
}
