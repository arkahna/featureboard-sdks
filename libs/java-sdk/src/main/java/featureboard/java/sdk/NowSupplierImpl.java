package featureboard.java.sdk;

import featureboard.java.sdk.interfaces.NowSupplier;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.ApplicationScope;

import java.time.OffsetDateTime;

@ApplicationScope
@Component
public class NowSupplierImpl implements NowSupplier {

  private OffsetDateTime now = null;

  @Override
  public OffsetDateTime getNow() {
    return now;
  }

  @Override
  public void setNow(OffsetDateTime now) {
    this.now = now;
  }
}
