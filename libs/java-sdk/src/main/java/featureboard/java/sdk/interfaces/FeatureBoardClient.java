package featureboard.java.sdk.interfaces;

import featureboard.java.sdk.state.FeatureBoardStateSnapshot;

import java.math.BigDecimal;

public interface FeatureBoardClient {
  boolean getFeatureValue(String featureKey, boolean defaultValue);

  BigDecimal getFeatureValue(String featureKey, BigDecimal defaultValue);

  String getFeatureValue(String featureKey, String defaultValue);

  <TProp extends Enum<TProp>> TProp getFeatureValue(String featureKey, TProp defaultValue);

  void setSnapshot(FeatureBoardStateSnapshot snapshot);
}
