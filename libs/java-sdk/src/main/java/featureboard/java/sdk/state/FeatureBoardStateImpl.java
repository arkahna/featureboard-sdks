package featureboard.java.sdk.state;

import featureboard.java.sdk.interfaces.FeatureBoardState;
import featureboard.java.sdk.models.FeatureValue;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashMap;

@Service
public class FeatureBoardStateImpl  implements FeatureBoardState {
  private HashMap<String, FeatureValue> cache = new HashMap<>();

  // TODO: implement a more robust snapshotting system.
  // Without it this SDK may suffer from Performance issues.
  // Need to ensure each request has an update. See FeatureBoardState.cs in the .net SDK
  // Likewise, consider removing the Get from the interface
  @Override
  public FeatureBoardStateSnapshot GetSnapshot() {
    return new FeatureBoardStateSnapshot(cache);
  }

  @Override
  public void update(Collection<FeatureValue> state) {
    for (FeatureValue s : state) {
      cache.put(s.featureKey(), s);
    }
  }

  /**
   * Effectively deprecated - reading directly from the state. This is due for a refactor.
   *
   * @param featureKey
   * @return
   */
  public FeatureValue Get(String featureKey) {
    return cache.get(featureKey);
  }
}
