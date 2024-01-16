package featureboard.java.sdk.interfaces;

import java.util.List;

/**
 * Implemented by any consuming client/application
 */
public interface AudienceProvider {
    List<String> getAudienceKeys();
}
