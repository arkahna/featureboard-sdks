package featureboard.java.sdk.state;

import featureboard.java.sdk.interfaces.FeatureBoardState;
import featureboard.java.sdk.models.FeatureValue;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashMap;

@Service
public class FeatureBoardStateImpl implements FeatureBoardState {

  private HashMap<String, FeatureValue> cache = new HashMap<>();

  public FeatureBoardStateImpl(FeatureBoardStateSnapshot snapshot) {

  }

  // TODO: implement a more robust snapshotting system.
  // Without it this SDK may suffer from Performance issues.
  // Need to ensure each request has an update. See FeatureBoardState.cs in the .net SDK
  @Override
  public FeatureBoardStateSnapshot GetSnapshot() {
    return new FeatureBoardStateSnapshot(cache);
  }

  @Override
  public void update(Collection<FeatureValue> state) {
    cache = new HashMap<>();
    for (FeatureValue s : state) {
      cache.put(s.featureKey(), s);
    }
  }

  public FeatureValue Get(String featureKey) {
    // TODO: OR from snapshot hmm
    return cache.get(featureKey);
  }


  // OK so this is a HostedService under .net and as such refreshes - we can do this also in Java but slightly different
  public void updateSnapshot() {
    // TODO: do we want this?
    // Or handle it elsewhere eh
  }

}
