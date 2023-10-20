package featureboard.java.sdk.state;

import featureboard.java.sdk.models.FeatureValue;

import java.util.Map;

public class FeatureBoardStateSnapshot {
  private final Map<String, FeatureValue> snapshot;

  public FeatureBoardStateSnapshot(Map<String, FeatureValue> state) {
    snapshot = state;
  }

  public FeatureValue Get(String featureKey) {
    return snapshot.get(featureKey);
  }
}
