package featureboard.java.sdk;

import com.fasterxml.jackson.databind.node.TextNode;
import featureboard.java.sdk.audience.TestAudienceProviderImpl;
import featureboard.java.sdk.interfaces.AudienceProvider;
import featureboard.java.sdk.interfaces.FeatureBoardClient;
import featureboard.java.sdk.interfaces.FeatureBoardState;
import featureboard.java.sdk.models.AudienceExceptionValue;
import featureboard.java.sdk.models.FeatureValue;
import featureboard.java.sdk.state.FeatureBoardStateImpl;
import featureboard.java.sdk.state.FeatureBoardStateSnapshot;
import org.junit.Before;
import org.junit.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;

import static org.junit.Assert.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class FeatureBoardClientTest {

  @Mock
  private FeatureBoardState snapshotState;

  @Mock
  private AudienceProvider audienceProvider;

  private FeatureBoardClient featureBoardClient;

  @Before
  public void setUp() {
    snapshotState = mock(FeatureBoardStateImpl.class);
    audienceProvider = new TestAudienceProviderImpl();
    featureBoardClient = new FeatureBoardClientImpl(snapshotState, audienceProvider);
  }

  @Test
  public void WhenFeatureKeySet_getFeatureValue_returnsStringValue() {
    // Setup
    String featureKey = "featureKey";
    var defaultValue = "default_value";
    var featureValue = new TextNode("feature_value");

    var featureMap = new HashMap<String, FeatureValue>();
    featureMap.put(featureKey, new FeatureValue(featureKey, featureValue, Collections.emptyList()));

    // Arrange
    when(snapshotState.GetSnapshot()).thenReturn(new FeatureBoardStateSnapshot(featureMap));

    // Act
    String result = featureBoardClient.getFeatureValue(featureKey, defaultValue);
    assertFalse(result.isEmpty());
    assertEquals(result, featureValue.textValue());
  }

  @Test
  public void WhenManyFeatureKeysSet_getFeatureValue_returnsStringValue() {
    // Setup
    String featureKey = "featureKey";
    var defaultValue = "default_value";
    var featureValue = new TextNode("feature_value");

    var featureMap = new HashMap<String, FeatureValue>();
    featureMap.put(featureKey, new FeatureValue(featureKey, featureValue, Collections.emptyList()));
    featureMap.put("featureKey2", new FeatureValue("featureKey2", featureValue, Collections.emptyList()));
    featureMap.put("featureKey3", new FeatureValue("featureKey3", featureValue, Collections.emptyList()));
    featureMap.put("featureKey4", new FeatureValue("featureKey4", featureValue, Collections.emptyList()));

    // Arrange
    when(snapshotState.GetSnapshot()).thenReturn(new FeatureBoardStateSnapshot(featureMap));

    // Act
    String result = featureBoardClient.getFeatureValue(featureKey, defaultValue);
    assertFalse(result.isEmpty());
    assertEquals(result, featureValue.textValue());
  }

  @Test
  public void WhenFeatureKeyNotSet_getFeatureValue_returnsDefaultStringValue() {
    // Setup
    String featureKey = "featureKey";
    var defaultValue = "default_value";

    // Empty feature set
    var featureMap = new HashMap<String, FeatureValue>();

    // Act
    snapshotState.update(featureMap.values()); // i.e. empty
    when(snapshotState.GetSnapshot()).thenReturn(new FeatureBoardStateSnapshot(featureMap));

    String result = featureBoardClient.getFeatureValue(featureKey, defaultValue);

    // Should have value "default"
    assertFalse(result.isEmpty());
    assertEquals(result, defaultValue);
  }

  @Test
  public void WhenFeatureKeySet_getFeatureValue_returnsBooleanValue() {
    // Setup
    String featureKey = "featureKey";
    var defaultValue = false;
    var featureValue = new TextNode("true");

    var featureMap = new HashMap<String, FeatureValue>();
    featureMap.put(featureKey, new FeatureValue(featureKey, featureValue, Collections.emptyList()));

    // Arrange
    when(snapshotState.GetSnapshot()).thenReturn(new FeatureBoardStateSnapshot(featureMap));

    // Act
    var result = featureBoardClient.getFeatureValue(featureKey, defaultValue);
    assertTrue(result);
  }

  @Test
  public void WhenFeatureKeyNotSet_getFeatureValue_returnsDefaultBooleanValue() {
    // Setup
    String featureKey = "featureKey";
    var defaultValue = false;

    // Empty feature set
    var featureMap = new HashMap<String, FeatureValue>();

    // Act
    snapshotState.update(featureMap.values()); // i.e. empty
    when(snapshotState.GetSnapshot()).thenReturn(new FeatureBoardStateSnapshot(featureMap));

    var result = featureBoardClient.getFeatureValue(featureKey, defaultValue);

    // Should have value "default"
    assertFalse(result);
  }

  @Test
  public void WhenFeatureKeySet_getFeatureValue_returnsBigDecimalValue() {
    // Setup
    String featureKey = "featureKey";
    var defaultValue = new BigDecimal("111.2");
    var featureValue = new TextNode("10.0");

    var featureMap = new HashMap<String, FeatureValue>();
    featureMap.put(featureKey, new FeatureValue(featureKey, featureValue, Collections.emptyList()));

    // Arrange
    when(snapshotState.GetSnapshot()).thenReturn(new FeatureBoardStateSnapshot(featureMap));

    // Act
    var result = featureBoardClient.getFeatureValue(featureKey, defaultValue);
    assertNotNull(result);
    assertEquals(result, new BigDecimal(featureValue.textValue()));
  }

  @Test
  public void WhenFeatureKeyNotSet_getFeatureValue_returnsDefaultBigDecimalValue() {
    // Setup
    String featureKey = "featureKey";
    var defaultValue = new BigDecimal("111.2");

    var featureMap = new HashMap<String, FeatureValue>();

    // Arrange
    when(snapshotState.GetSnapshot()).thenReturn(new FeatureBoardStateSnapshot(featureMap));

    // Act
    var result = featureBoardClient.getFeatureValue(featureKey, defaultValue);
    assertNotNull(result);
    assertEquals(result, defaultValue);
  }

  @Test
  public void WhenFeatureKeySet_getFeatureValue_returnsOptionValue() {
    // Setup
    String featureKey = "featureKey";
    var defaultValue = TestEnum.BLUE;
    var featureValue = new TextNode(TestEnum.RED.name());

    var featureMap = new HashMap<String, FeatureValue>();
    featureMap.put(featureKey, new FeatureValue(featureKey, featureValue, Collections.emptyList()));

    // Arrange
    when(snapshotState.GetSnapshot()).thenReturn(new FeatureBoardStateSnapshot(featureMap));

    // Act
    var result = featureBoardClient.getFeatureValue(featureKey, defaultValue);
    assertNotNull(result);
    assertEquals(result.toString(), featureValue.textValue());
  }

  @Test
  public void WhenFeatureKeyNotSet_getFeatureValue_returnsDefaultOptionValue() {
    // Setup
    String featureKey = "featureKey";
    var defaultValue = TestEnum.BLUE;

    var featureMap = new HashMap<String, FeatureValue>();

    // Arrange
    when(snapshotState.GetSnapshot()).thenReturn(new FeatureBoardStateSnapshot(featureMap));

    // Act
    var result = featureBoardClient.getFeatureValue(featureKey, defaultValue);
    assertNotNull(result);
    assertEquals(result, defaultValue);
  }

  @Test
  public void WhenFeatureKeySet_AudienceSet_returnsAudienceValue() {
    // Setup
    String featureKey = "featureKey";
    var defaultValue = "default_value";
    var featureValue = new TextNode("feature_value");
    var audienceValue = new TextNode("audience_value");
    var audienceList = new ArrayList<AudienceExceptionValue>();
    audienceList.add(new AudienceExceptionValue("someAudience", audienceValue));

    var featureMap = new HashMap<String, FeatureValue>();
    // Given we have a concrete here - seems more straight forward than mocking the audience call in this instance
    featureMap.put(featureKey, new FeatureValue(featureKey, featureValue, audienceList));

    // Arrange
    when(snapshotState.GetSnapshot()).thenReturn(new FeatureBoardStateSnapshot(featureMap));

    // Act
    String result = featureBoardClient.getFeatureValue(featureKey, defaultValue);
    assertFalse(result.isEmpty());
    assertNotEquals(result, featureValue.textValue());
    assertEquals(result, audienceValue.textValue());
  }

  @Test
  public void WhenFeatureKeySet_AudienceNotFoundSet_returnsFeatureValue() {
    // Setup
    String featureKey = "featureKey";
    var defaultValue = "default_value";
    var featureValue = new TextNode("feature_value");
    var audienceValue = new TextNode("audience_value");
    var audienceList = new ArrayList<AudienceExceptionValue>();
    audienceList.add(new AudienceExceptionValue("some_missing_audience", audienceValue));

    var featureMap = new HashMap<String, FeatureValue>();
    // Given we have a concrete here - seems more straight forward than mocking the audience call in this instance
    featureMap.put(featureKey, new FeatureValue(featureKey, featureValue, audienceList));

    // Arrange
    when(snapshotState.GetSnapshot()).thenReturn(new FeatureBoardStateSnapshot(featureMap));

    // Act
    String result = featureBoardClient.getFeatureValue(featureKey, defaultValue);
    assertFalse(result.isEmpty());
    assertEquals(result, featureValue.textValue());
  }

}
