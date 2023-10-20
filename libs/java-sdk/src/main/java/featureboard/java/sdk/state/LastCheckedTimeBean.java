package featureboard.java.sdk.state;


import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.ApplicationScope;

import java.time.OffsetDateTime;
import java.util.concurrent.atomic.AtomicReference;

// TODO: change the name this is dumb
// TODO: check this handles the offset in the same way (keeps value) as the .net version of LastCheckedTimeProvider class
@ApplicationScope
@Component
public class LastCheckedTimeBean {

  // TODO: final or not
  private AtomicReference<OffsetDateTime> lastCheckedTimeReference = new AtomicReference<>(OffsetDateTime.now());

  public OffsetDateTime getLastCheckedTime() {
    return lastCheckedTimeReference.get();
  }

  public AtomicReference<OffsetDateTime> getLastCheckedTimeReference() {
    return lastCheckedTimeReference;
  }
}
