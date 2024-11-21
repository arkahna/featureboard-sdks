package featureboard.java.sdk.state;

import featureboard.java.sdk.models.FeatureValue;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class FeatureBoardStateSnapshot {
  private final Map<String, FeatureValue> snapshot;

  public FeatureBoardStateSnapshot(Map<String, FeatureValue> state) {
    snapshot = state;
  }

  public FeatureValue Get(String featureKey) {
    return snapshot.get(featureKey);
  }
}
