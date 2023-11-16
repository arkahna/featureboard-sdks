package featureboard.java.sdk;

import featureboard.java.sdk.config.FeatureBoardConfiguration;
import featureboard.java.sdk.state.LastCheckedTimeProvider;
import org.junit.Before;
import org.junit.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.concurrent.CompletableFuture;

import static org.junit.Assert.assertFalse;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FeatureBoardLastCheckedServiceTest {

  @Mock
  private FeatureBoardServiceImpl featureBoardService;

  @Mock
  private FeatureBoardConfiguration featureBoardConfiguration;

  @Mock
  private LastCheckedTimeProvider lastCheckedTimeProvider;

  private FeatureBoardLastCheckedServiceImpl featureBoardLastCheckedService;

  @Before
  public void setUp() {
    featureBoardService = mock(FeatureBoardServiceImpl.class);
    featureBoardConfiguration = mock(FeatureBoardConfiguration.class);
    lastCheckedTimeProvider = mock(LastCheckedTimeProvider.class);

    featureBoardLastCheckedService = new FeatureBoardLastCheckedServiceImpl(featureBoardService, featureBoardConfiguration, lastCheckedTimeProvider);
  }

  @Test
  public void WhenMaxAgeHasExpired_RefreshConfiguration() {
    // Setup/Arrange
    // Max Age of 30 seconds
    when(featureBoardConfiguration.getMaxAge()).thenReturn(Duration.ofSeconds(30));
    // 40 seconds in the past - older than max age
    when(lastCheckedTimeProvider.getLastCheckedTime()).thenReturn(OffsetDateTime.now().minusSeconds(40));
    when(featureBoardService.refreshFeatureConfiguration()).thenReturn(new CompletableFuture<>());

    // Act
    featureBoardLastCheckedService.refreshFeatureConfiguration();
    verify(featureBoardService, times(1)).refreshFeatureConfiguration();
  }

  @Test
  public void WhenMaxAgeHasNotExpired_RefreshConfiguration() {
    // Setup/Arrange
    // Max Age of 30 seconds
    when(featureBoardConfiguration.getMaxAge()).thenReturn(Duration.ofSeconds(30));
    // 10 seconds in the past - max axe has not expired
    when(lastCheckedTimeProvider.getLastCheckedTime()).thenReturn(OffsetDateTime.now().minusSeconds(10));

    // Act
    assertFalse(featureBoardLastCheckedService.refreshFeatureConfiguration().resultNow());
    // i.e. do not refresh config
    verify(featureBoardService, times(0)).refreshFeatureConfiguration();
  }

  @Test
  public void WhenMaxAgeHasExpired_LastCheckedTimeUpdated() {
    // Setup/Arrange
    // Max Age of 30 seconds
    when(featureBoardConfiguration.getMaxAge()).thenReturn(Duration.ofSeconds(30));
    // 40 seconds in the past - older than max age
    when(lastCheckedTimeProvider.getLastCheckedTime()).thenReturn(OffsetDateTime.now().minusSeconds(40));
    when(featureBoardService.refreshFeatureConfiguration()).thenReturn(CompletableFuture.completedFuture(true));

    // Act
    featureBoardLastCheckedService.refreshFeatureConfiguration();
    verify(featureBoardService, times(1)).refreshFeatureConfiguration();
    verify(lastCheckedTimeProvider, times(1)).getLastCheckedTimeReference();
  }
}
