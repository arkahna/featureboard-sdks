package featureboard.java.sdk.interfaces;

import featureboard.java.sdk.models.FeatureValue;
import featureboard.java.sdk.state.FeatureBoardStateSnapshot;

import java.util.Collection;

public interface FeatureBoardState {

  FeatureBoardStateSnapshot GetSnapshot();

  void update(Collection<FeatureValue> state);

  FeatureValue Get(String featureKey);
}
