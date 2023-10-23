package featureboard.java.sdk.interfaces;

import java.time.OffsetDateTime;

public interface NowSupplier {
  public OffsetDateTime getNow();

  public void setNow(OffsetDateTime now);
}
