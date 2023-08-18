using System;
using System.Linq.Expressions;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging.Abstractions;
using Bogus;
using Moq;
using FeatureBoard.DotnetSdk.Models;
using System.Net.Http.Headers;

namespace FeatureBoard.DotnetSdk.Test
{
  public class FeatureBoardHttpClientTests
  {
    private const string TestETag = @"""test""";
    private EntityTagHeaderValue? _nullETag = null;

    private static readonly Expression<Func<HttpRequestMessage, bool>> _defaultRequestMatcher = msg => msg.Method == HttpMethod.Get && msg.RequestUri!.OriginalString == FeatureBoardHttpClient.Action;

    private readonly Mock<HttpClient> _mockHttpClient = new Mock<HttpClient>();

    private readonly FeatureConfiguration testFeatureConfig = CreateFeature();


    public FeatureBoardHttpClientTests()
    {
      var content = JsonContent.Create(new[] { testFeatureConfig });
      _mockHttpClient
        .Setup(client => client.SendAsync(It.Is<HttpRequestMessage>(_defaultRequestMatcher), It.IsAny<CancellationToken>()))
        .ReturnsAsync((HttpRequestMessage request, CancellationToken _) =>
        {
          var response = new HttpResponseMessage() { Content = content, RequestMessage = request };
          response.Headers.ETag = new EntityTagHeaderValue(TestETag);
          return response;
        });

    }

    [Fact]
    public async Task ItReturnsCorrectListOfFeatures()
    {
      // Arrange
      IReadOnlyCollection<FeatureConfiguration>? actionArg = null;
      void captureArgAction(IReadOnlyCollection<FeatureConfiguration> features) => actionArg = features;

      var testSubject = new FeatureBoardHttpClient(_mockHttpClient.Object, () => ref _nullETag, captureArgAction, new NullLogger<FeatureBoardHttpClient>());

      // Act
      var result = await testSubject.RefreshFeatureConfiguration(CancellationToken.None);

      // Assert
      Assert.True(result);
      Assert.NotNull(actionArg);
      // DEBT: Refactor FeatureConfiguration to remove use of JsonValue and override Equals so get *full* ValueType equality semantics hence can just replace below with use of Assert.Equals()
      Assert.Collection(actionArg, item =>
      {
        Assert.Equal(testFeatureConfig.FeatureKey, item.FeatureKey);
        Assert.Equal(testFeatureConfig.DefaultValue.GetValue<string>(), item.DefaultValue.GetValue<string>());
        Assert.Collection(item.AudienceExceptions,
          ex =>
          {
            var expected = testFeatureConfig.AudienceExceptions[0];
            Assert.Equal(expected.AudienceKey, ex.AudienceKey);
            Assert.Equal(expected.Value.GetValue<string>(), ex.Value.GetValue<string>());
          },
          ex =>
          {
            var expected = testFeatureConfig.AudienceExceptions[1];
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
      static void nopAction(IReadOnlyCollection<FeatureConfiguration> features) { }

      Expression<Func<HttpRequestMessage, bool>> hasEtagMatcher = msg => _defaultRequestMatcher.Compile()(msg) && msg.Headers.IfNoneMatch.Any(t => t.Equals(new EntityTagHeaderValue(TestETag)));

      _mockHttpClient
        .Setup(client => client.SendAsync(It.Is<HttpRequestMessage>(hasEtagMatcher), It.IsAny<CancellationToken>()))
        .ReturnsAsync(new HttpResponseMessage() { StatusCode = HttpStatusCode.NotModified });

      var testSubject = new FeatureBoardHttpClient(_mockHttpClient.Object, () => ref _nullETag, nopAction, new NullLogger<FeatureBoardHttpClient>());

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
      static void exceptionAction(IReadOnlyCollection<FeatureConfiguration> features) => throw new InvalidOperationException();

      _mockHttpClient
        .Setup(client => client.SendAsync(It.Is<HttpRequestMessage>(_defaultRequestMatcher), It.IsAny<CancellationToken>()))
        .ReturnsAsync((HttpRequestMessage request, CancellationToken _) => new HttpResponseMessage(httpStatusCode) { RequestMessage = request });
      var testSubject = new FeatureBoardHttpClient(_mockHttpClient.Object, () => ref _nullETag, exceptionAction, new NullLogger<FeatureBoardHttpClient>());

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
