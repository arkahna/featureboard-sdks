package featureboard.java.sdk.state;

import org.springframework.stereotype.Service;
import org.springframework.web.context.annotation.ApplicationScope;

@Service
// TODO: hopefully this works
@ApplicationScope
public class ETagState {

  private String eTagValue = "";

  public String geteTagValue() {
    return eTagValue;
  }

  public void seteTagValue(String eTagValue) {
    this.eTagValue = eTagValue;
  }
}
