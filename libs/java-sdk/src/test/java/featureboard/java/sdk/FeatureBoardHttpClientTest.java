package featureboard.java.sdk;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.TextNode;
import featureboard.java.sdk.config.FeatureBoardConfiguration;
import featureboard.java.sdk.http.HttpRequestBuilder;
import featureboard.java.sdk.interfaces.FeatureBoardState;
import featureboard.java.sdk.models.FeatureValue;
import featureboard.java.sdk.state.ETagState;
import org.junit.Before;
import org.junit.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FeatureBoardHttpClientTest {

  @Mock
  private HttpClient httpClient;
  @Mock
  private HttpRequestBuilder httpRequestBuilder;
  @Mock
  private FeatureBoardState featureBoardState;
  @Mock
  private ETagState eTagState;
  @Mock
  private FeatureBoardConfiguration configuration;
  @Mock
  private HttpResponse<String> httpResponse;
  @Mock
  private HttpRequest httpRequest;
  @Mock
  private ObjectMapper objectMapper;
  @Mock
  private HttpHeaders httpHeaders;

  private FeatureBoardHttpClientImpl featureBoardHttpClient;


  @Before
  public void setUp() {
    httpClient = mock(HttpClient.class);
    httpRequestBuilder = mock(HttpRequestBuilder.class);
    featureBoardState = mock(FeatureBoardState.class);
    eTagState = mock(ETagState.class);
    configuration = mock(FeatureBoardConfiguration.class);

    httpResponse = mock(HttpResponse.class);
    httpRequest = mock(HttpRequest.class);
    objectMapper = mock(ObjectMapper.class);
    httpHeaders = mock(HttpHeaders.class);

    featureBoardHttpClient = new FeatureBoardHttpClientImpl(httpRequestBuilder, featureBoardState, eTagState, httpClient, objectMapper);
  }

  @Test
  public void WhenRequestSent_304ReturnNothingChanged() throws ExecutionException, InterruptedException {
    var builder = HttpRequest.newBuilder(URI.create("http://some-address.com"))
      .GET()
      .setHeader("x-environment-key", "abc123");
    when(httpRequestBuilder.createGETBuilder("all")).thenReturn(builder);
    when(eTagState.geteTagValue()).thenReturn("tag123");

    when(httpResponse.statusCode()).thenReturn(304);
    when(httpResponse.request()).thenReturn(httpRequest);

    when(httpClient.sendAsync(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
      .thenReturn(CompletableFuture.completedFuture(httpResponse));

    assertFalse(featureBoardHttpClient.refreshFeatureConfiguration().get());
    verify(featureBoardState, times(0)).update(anyCollection());
  }

  @Test
  public void WhenRequestSent_401ReturnNull() throws ExecutionException, InterruptedException {
    var builder = HttpRequest.newBuilder(URI.create("http://some-address.com"))
      .GET()
      .setHeader("x-environment-key", "invalidKey");
    when(httpRequestBuilder.createGETBuilder("all")).thenReturn(builder);
    when(eTagState.geteTagValue()).thenReturn("tag123");

    when(httpResponse.statusCode()).thenReturn(401);
    when(httpResponse.request()).thenReturn(httpRequest);

    when(httpClient.sendAsync(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
      .thenReturn(CompletableFuture.completedFuture(httpResponse));

    assertNull(featureBoardHttpClient.refreshFeatureConfiguration().get());
    verify(featureBoardState, times(0)).update(anyCollection());

  }

  @Test
  public void WhenRequestSent_200ReturnTrueConfigurationUpdated() throws ExecutionException, InterruptedException, JsonProcessingException {
    var builder = HttpRequest.newBuilder(URI.create("http://some-address.com"))
      .GET()
      .setHeader("x-environment-key", "abc123");
    when(httpRequestBuilder.createGETBuilder("all")).thenReturn(builder);
    when(eTagState.geteTagValue()).thenReturn("tag123");

    when(httpResponse.statusCode()).thenReturn(200);
    when(httpResponse.request()).thenReturn(httpRequest);
    String json = "\"[{\"featureKey\":\"string_toggle\",\"defaultValue\":\"An Example String Toggle\",\"audienceExceptions\":[]}]\"";
    when(httpResponse.body()).thenReturn(json);

    when(httpResponse.headers()).thenReturn(httpHeaders);
    when(httpResponse.headers().firstValue(anyString())).thenReturn(Optional.of("some_val"));

    var featureList = new ArrayList<FeatureValue>();
    featureList.add(new FeatureValue("string_toggle", new TextNode("An Example String Toggle"), new ArrayList<>()));

    when(objectMapper.readValue(anyString(), any(TypeReference.class))).thenReturn(featureList);
    when(httpClient.sendAsync(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
      .thenReturn(CompletableFuture.completedFuture(httpResponse));

    assertTrue(featureBoardHttpClient.refreshFeatureConfiguration().get());
    // State updated
    verify(featureBoardState, times(1)).update(anyCollection());
  }

  // Note: missing an easier way to construct a builderMock, so ETag mocking/testing is proving elusive
}
