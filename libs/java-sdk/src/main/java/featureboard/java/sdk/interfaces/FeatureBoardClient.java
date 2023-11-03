package featureboard.java.sdk.interfaces;

import featureboard.java.sdk.state.FeatureBoardStateSnapshot;

import java.math.BigDecimal;

public interface FeatureBoardClient {
  boolean GetFeatureValue(String featureKey, boolean defaultValue);

  BigDecimal GetFeatureValue(String featureKey, BigDecimal defaultValue);

  String GetFeatureValue(String featureKey, String defaultValue);

  <TProp extends Enum<TProp>> TProp GetFeatureValue(String featureKey, TProp defaultValue);

  void setSnapshot(FeatureBoardStateSnapshot snapshot);
}
