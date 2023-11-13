package featureboard.java.sdk.state;


import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.ApplicationScope;

import java.time.OffsetDateTime;
import java.util.concurrent.atomic.AtomicReference;

@ApplicationScope
@Component
public class LastCheckedTimeProvider {

  private final AtomicReference<OffsetDateTime> lastCheckedTimeReference = new AtomicReference<>(OffsetDateTime.now());

  public OffsetDateTime getLastCheckedTime() {
    return lastCheckedTimeReference.get();
  }

  public AtomicReference<OffsetDateTime> getLastCheckedTimeReference() {
    return lastCheckedTimeReference;
  }
}
