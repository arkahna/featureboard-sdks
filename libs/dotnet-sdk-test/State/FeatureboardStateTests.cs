using System.Text.Json.Nodes;
using Bogus;
using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.State;
using FeatureBoard.DotnetSdk.Test.Extensions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Shouldly;

namespace FeatureBoard.DotnetSdk.Test.State;

public class FeatureBoardStateTests
{
  private readonly IServiceCollection Services = new ServiceCollection();

  public FeatureBoardStateTests()
  {
    Services.AddTransient(typeof(ILogger<>), typeof(NullLogger<>));
    Services.AddTransient<FeatureBoardState>();

  }

  [Fact]
  public async Task StartAsyncLoadsStateFromExternalStateIfProvided()
  {
    // Arrange
    var featureConfiguration = CreateFeature();

    Services.AddServiceMock<IFeatureBoardExternalState>((_, mock) =>
      mock
        .Setup(x => x.GetState(It.IsAny<CancellationToken>()))
        .ReturnsAsync(new[] { featureConfiguration })
       );

    var featureBoardState = Services.BuildServiceProvider().GetRequiredService<FeatureBoardState>();

    // Act
    await featureBoardState.StartAsync(CancellationToken.None);
    var resolvedFeature = featureBoardState.GetSnapshot().Get(featureConfiguration.FeatureKey);

    // Assert
    resolvedFeature.ShouldBe(featureConfiguration);
  }

  [Fact]
  public async Task StartAsyncLoadsStateFromServiceIfExternalStateNotProvided()
  {
    // Arrange
    var featureConfiguration = CreateFeature();

    FeatureBoardState? testSubject = null;
    Services.AddServiceMock<IFeatureBoardService>((provider, mock) =>
      mock.Setup(x => x.RefreshFeatureConfiguration(It.IsAny<CancellationToken>()))
       .Callback(() => testSubject!.Update(new[] { featureConfiguration }))
       .ReturnsAsync(true)
    );

    testSubject = Services.BuildServiceProvider().GetRequiredService<FeatureBoardState>();

    // Act
    await testSubject.StartAsync(CancellationToken.None);
    var resolvedFeature = testSubject.GetSnapshot().Get(featureConfiguration.FeatureKey);

    // Assert
    resolvedFeature.ShouldBe(featureConfiguration);
  }

  private static FeatureConfiguration CreateFeature()
  {
    var faker = new Faker();
    return new FeatureConfiguration
    {
      DefaultValue = JsonValue.Create(faker.Lorem.Sentence())!,
      FeatureKey = nameof(TestFeatures.StringFeature),
      AudienceExceptions = Array.Empty<AudienceExceptionValue>()
    };
  }
}
