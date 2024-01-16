using System.Linq.Expressions;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Bogus;
using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.State;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace FeatureBoard.DotnetSdk.Test
{
  public class FeatureBoardHttpClientTests
  {
    private const string TestETag = @"""test""";
    private EntityTagHeaderValue? _nullETag = null;

    private static readonly Expression<Func<HttpRequestMessage, bool>> _defaultRequestMatcher = msg => msg.Method == HttpMethod.Get && msg.RequestUri!.OriginalString == FeatureBoardHttpClient.Action;

    private readonly Mock<HttpClient> _mockHttpClient = new();
    private readonly Mock<FeatureBoardStateUpdater> _mockStateUpdater = new(null);

    private readonly FeatureConfiguration _testFeatureConfig = CreateFeature();


    public FeatureBoardHttpClientTests()
    {
      var content = JsonContent.Create(new[] { _testFeatureConfig });
      _mockHttpClient
        .Setup(client => client.SendAsync(It.Is<HttpRequestMessage>(_defaultRequestMatcher), It.IsAny<CancellationToken>()))
        .ReturnsAsync((HttpRequestMessage request, CancellationToken _) =>
        {
          var response = new HttpResponseMessage() { Content = content, RequestMessage = request };
          response.Headers.ETag = new EntityTagHeaderValue(TestETag);
          return response;
        });

      _mockStateUpdater
        .Setup(m => m.UpdateState(It.IsAny<IReadOnlyCollection<FeatureConfiguration>>(), It.IsAny<CancellationToken>()))
        .Verifiable();
    }

    [Fact]
    public async Task ItReturnsCorrectListOfFeatures()
    {
      // Arrange
      IReadOnlyCollection<FeatureConfiguration>? actionArg = null;

      _mockStateUpdater.Setup(m => m.UpdateState(It.IsAny<IReadOnlyCollection<FeatureConfiguration>>(), It.IsAny<CancellationToken>()))
        .Callback((IReadOnlyCollection<FeatureConfiguration> features, CancellationToken token) => actionArg = features);

      var testSubject = new FeatureBoardHttpClient(_mockHttpClient.Object, () => ref _nullETag, new[] { _mockStateUpdater.Object }, new NullLogger<FeatureBoardHttpClient>());

      // Act
      var result = await testSubject.RefreshFeatureConfiguration(CancellationToken.None);

      // Assert
      Assert.True(result);
      Assert.NotNull(actionArg);
      // DEBT: Refactor FeatureConfiguration to remove use of JsonValue and override Equals so get *full* ValueType equality semantics hence can just replace below with use of Assert.Equals()
      Assert.Collection(actionArg, item =>
      {
        Assert.Equal(_testFeatureConfig.FeatureKey, item.FeatureKey);
        Assert.Equal(_testFeatureConfig.DefaultValue.GetValue<string>(), item.DefaultValue.GetValue<string>());
        Assert.Collection(item.AudienceExceptions,
          ex =>
          {
            var expected = _testFeatureConfig.AudienceExceptions[0];
            Assert.Equal(expected.AudienceKey, ex.AudienceKey);
            Assert.Equal(expected.Value.GetValue<string>(), ex.Value.GetValue<string>());
          },
          ex =>
          {
            var expected = _testFeatureConfig.AudienceExceptions[1];
            Assert.Equal(expected.AudienceKey, ex.AudienceKey);
            Assert.Equal(expected.Value.GetValue<string>(), ex.Value.GetValue<string>());
          }
        );
      });
    }

    [Fact]
    public async Task ItDoesNotProcessResponseIfNotModified()
    {
      // Arrange
      Expression<Func<HttpRequestMessage, bool>> hasEtagMatcher = msg => _defaultRequestMatcher.Compile()(msg) && msg.Headers.IfNoneMatch.Any(t => t.Equals(new EntityTagHeaderValue(TestETag)));

      _mockHttpClient
        .Setup(client => client.SendAsync(It.Is<HttpRequestMessage>(hasEtagMatcher), It.IsAny<CancellationToken>()))
        .ReturnsAsync(new HttpResponseMessage() { StatusCode = HttpStatusCode.NotModified });

      var testSubject = new FeatureBoardHttpClient(_mockHttpClient.Object, () => ref _nullETag, new[] { _mockStateUpdater.Object }, new NullLogger<FeatureBoardHttpClient>());

      // Act
      var initialResult = await testSubject.RefreshFeatureConfiguration(CancellationToken.None);
      var subsequentResult = await testSubject.RefreshFeatureConfiguration(CancellationToken.None);

      // Assert
      Assert.True(initialResult);
      Assert.False(subsequentResult);
    }


    [Theory]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.InternalServerError)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    [InlineData(HttpStatusCode.Accepted)]
    [InlineData(HttpStatusCode.NoContent)]
    public async Task ItDoesNotProcessResponseOnNonOkayResponse(HttpStatusCode httpStatusCode)
    {
      // Arrange
      _mockHttpClient
        .Setup(client => client.SendAsync(It.Is<HttpRequestMessage>(_defaultRequestMatcher), It.IsAny<CancellationToken>()))
        .ReturnsAsync((HttpRequestMessage request, CancellationToken _) => new HttpResponseMessage(httpStatusCode) { RequestMessage = request });
      var testSubject = new FeatureBoardHttpClient(_mockHttpClient.Object, () => ref _nullETag, Array.Empty<IFeatureBoardStateUpdateHandler>(), new NullLogger<FeatureBoardHttpClient>());

      // Act
      var result = await testSubject.RefreshFeatureConfiguration(CancellationToken.None);

      // Assert
      Assert.Null(result);
    }


    public static object[][] ExternalStateUpdateExceptions => new[]
    {
      new [] { new Exception() },
    };

    [Theory]
    [MemberData(nameof(ExternalStateUpdateExceptions))]
    public async Task ItDoesNotAllowExternalStateUpdateHandlerExceptionToBubble(Exception exception)
    {
      // Arrange
      var exceptioningUpdater = new Mock<IFeatureBoardStateUpdateHandler>();
      exceptioningUpdater.Setup(m => m.UpdateState(It.Is((IReadOnlyCollection<FeatureConfiguration> features) => features.Any(config => config.FeatureKey == _testFeatureConfig.FeatureKey)), It.IsAny<CancellationToken>()))
        .ThrowsAsync(exception);

      var testSubject = new FeatureBoardHttpClient(_mockHttpClient.Object, () => ref _nullETag, new[] { exceptioningUpdater.Object, _mockStateUpdater.Object }, new NullLogger<FeatureBoardHttpClient>());

      // Act
      var result = await testSubject.RefreshFeatureConfiguration(CancellationToken.None);

      // Assert
      Assert.Null(result);
      Assert.NotNull(_nullETag);
      _mockStateUpdater.Verify(); // Verify StateUpdater was called, even though exceptioningUpdater appears 1st in the list of update handlers
    }


    public static object[][] FeatureBoardStateUpdaterExceptions => new[]
    {
      new Exception[] { new ArgumentException() },
      new Exception[] { new TaskCanceledException() }
    };

    [Theory]
    [MemberData(nameof(FeatureBoardStateUpdaterExceptions))]
    public async Task ItDoesNotAllowFeatureBoardUpdateHandlerExceptionToBubbleAndDoesNotUpdateETag(Exception exception)
    {
      // Arrange
      var otherHandler = new Mock<IFeatureBoardStateUpdateHandler>();
      otherHandler.Setup(m => m.UpdateState(It.IsAny<IReadOnlyCollection<FeatureConfiguration>>(), It.IsAny<CancellationToken>()));

      _mockStateUpdater.Setup(m => m.UpdateState(It.Is((IReadOnlyCollection<FeatureConfiguration> features) => features.Any(config => config.FeatureKey == _testFeatureConfig.FeatureKey)), It.IsAny<CancellationToken>()))
        .ThrowsAsync(exception); // eg. what would happen if duplicate feature keys are returned

      var testSubject = new FeatureBoardHttpClient(_mockHttpClient.Object, () => ref _nullETag, new[] { otherHandler.Object, _mockStateUpdater.Object, }, new NullLogger<FeatureBoardHttpClient>());

      // Act
      var result = await testSubject.RefreshFeatureConfiguration(CancellationToken.None);

      // Assert
      Assert.Null(result);
      Assert.Null(_nullETag);
      Assert.Empty(otherHandler.Invocations); // Verify "other" handler is never even called after our FeatureBoardStateUpdater exceptioned
    }


    [Fact]
    public async Task ItDoesNotAllowTransientNetworkRequestErrorsToBubble()
    {
      // Arrange
      _mockHttpClient
        .Setup(client => client.SendAsync(It.Is<HttpRequestMessage>(_defaultRequestMatcher), It.IsAny<CancellationToken>()))
        .ThrowsAsync(new HttpRequestException());

      var testSubject = new FeatureBoardHttpClient(_mockHttpClient.Object, () => ref _nullETag, Array.Empty<IFeatureBoardStateUpdateHandler>(), new NullLogger<FeatureBoardHttpClient>());

      // Act
      var result = await testSubject.RefreshFeatureConfiguration(CancellationToken.None);

      // Assert
      Assert.Null(result);
    }



    private static FeatureConfiguration CreateFeature()
    {
      var faker = new Faker();
      return new FeatureConfiguration
      {
        DefaultValue = JsonValue.Create(faker.Lorem.Word())!,
        FeatureKey = nameof(TestFeatures.StringFeature),
        AudienceExceptions = faker.Make(2, () => new AudienceExceptionValue()
        {
          AudienceKey = faker.Commerce.Categories(1)[0],
          Value = JsonValue.Create(faker.Lorem.Word())!
        }).ToArray()
      };
    }

  }
}
