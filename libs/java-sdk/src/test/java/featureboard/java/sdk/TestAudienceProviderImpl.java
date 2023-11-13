package featureboard.java.sdk;

import featureboard.java.sdk.interfaces.AudienceProvider;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TestAudienceProviderImpl implements AudienceProvider {
  @Override
  public List<String> getAudienceKeys() {
    List<String> validKeys = new ArrayList<>();
    validKeys.add("someAudience");
    return validKeys;
  }
}
