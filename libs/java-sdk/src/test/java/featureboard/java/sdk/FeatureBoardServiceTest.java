package featureboard.java.sdk;

import featureboard.java.sdk.interfaces.FeatureBoardHttpClient;
import org.junit.Before;
import org.junit.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.concurrent.Semaphore;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FeatureBoardServiceTest {

  @Mock
  private FeatureBoardHttpClient featureBoardHttpClient;

  @Mock
  private Semaphore semaphore;

  private FeatureBoardServiceImpl featureBoardService;

  @Before
  public void setUp() {
    featureBoardHttpClient = mock(FeatureBoardHttpClientImpl.class);
    semaphore = mock(Semaphore.class);
    featureBoardService = new FeatureBoardServiceImpl(featureBoardHttpClient, semaphore);
  }

  @Test
  public void WhenCannotAcquireSemaphore_DoNotRefreshConfiguration() {
    when(semaphore.tryAcquire()).thenReturn(false);

    featureBoardService.refreshFeatureConfiguration();

    verify(featureBoardHttpClient, times(0)).refreshFeatureConfiguration();
  }

  @Test
  public void WhenAcquireSemaphoreLock_RefreshConfiguration() {
    when(semaphore.tryAcquire()).thenReturn(true);

    featureBoardService.refreshFeatureConfiguration();

    verify(featureBoardHttpClient, times(1)).refreshFeatureConfiguration();
  }
}
