using Bogus;
using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.State;
using Moq;
using Shouldly;
using System.Text.Json.Nodes;

namespace FeatureBoard.DotnetSdk.Test.State;

public class FeatureBoardStateTests : SdkTestsBase
{
  public FeatureBoardStateTests()
  {
    Services.AddService<IFeatureBoardState, FeatureBoardState>();
    Services.AddServiceMock<IFeatureBoardExternalState>();
  }

  [Fact]
  public void InitialiseStateGetsStateFromExternalStateIfNoFeaturesAreProvided()
  {
    var featureConfiguration = CreateFeature();

    var featureBoardExternalStateMock = Services.Resolve<Mock<IFeatureBoardExternalState>>();
    featureBoardExternalStateMock.Setup(x => x.GetState(It.IsAny<CancellationToken>()))
      .Returns(Task.FromResult(new List<FeatureConfiguration>
        { featureConfiguration }));


    var featureBoardState = Services.Resolve<IFeatureBoardState>();
    featureBoardState.InitialiseState(null, null, CancellationToken.None);
    var resolvedFeature = featureBoardState.GetSnapshot().Get(featureConfiguration.FeatureKey);

    featureBoardExternalStateMock.Verify(x => x.GetState(It.IsAny<CancellationToken>()), Times.Once);
    resolvedFeature.ShouldBe(featureConfiguration);
  }

  [Fact]
  public void InitialiseStateDoesNotGetStateFromExternalStateIfFeaturesAreProvided()
  {
    var featureConfiguration = CreateFeature();

    var featureBoardState = Services.Resolve<IFeatureBoardState>();
    featureBoardState.InitialiseState(new List<FeatureConfiguration>
        { featureConfiguration }, DateTimeOffset.UtcNow.ToString(),
      CancellationToken.None);
    var resolvedFeature = featureBoardState.GetSnapshot().Get(featureConfiguration.FeatureKey);

    var featureBoardExternalStateMock = Services.Resolve<Mock<IFeatureBoardExternalState>>();
    featureBoardExternalStateMock.Verify(x => x.GetState(It.IsAny<CancellationToken>()), Times.Never);
    resolvedFeature.ShouldBe(featureConfiguration);
  }


  [Fact]
  public void InitialiseStateSetsLastUpdated()
  {
    var featureConfiguration = CreateFeature();

    var featureBoardState = Services.Resolve<IFeatureBoardState>();
    featureBoardState.InitialiseState(new List<FeatureConfiguration>
        { featureConfiguration }, DateTimeOffset.UtcNow.ToString(),
      CancellationToken.None);

    featureBoardState.LastUpdated.ShouldNotBeNull();
    featureBoardState.LastUpdated.Value.ShouldBeInRange(DateTimeOffset.UtcNow.AddSeconds(-1), DateTimeOffset.UtcNow);
  }

  [Fact]
  public void InitialiseStateSetsETag()
  {
    var featureConfiguration = CreateFeature();
    var eTag = DateTimeOffset.UtcNow.ToString();

    var featureBoardState = Services.Resolve<IFeatureBoardState>();
    featureBoardState.InitialiseState(new List<FeatureConfiguration>
        {featureConfiguration }, eTag,
      CancellationToken.None);

    featureBoardState.ETag.ShouldNotBeNull();
    featureBoardState.ETag.ShouldBe(eTag);
  }

  [Fact]
  public void UpdateStateSetsLastUpdatedIfFeaturesAreProvided()
  {
    var featureConfiguration = CreateFeature();

    var featureBoardState = Services.Resolve<IFeatureBoardState>();
    featureBoardState.UpdateState(new List<FeatureConfiguration>
        { featureConfiguration }, DateTimeOffset.UtcNow.ToString(),
      CancellationToken.None);

    featureBoardState.LastUpdated.ShouldNotBeNull();
    featureBoardState.LastUpdated.Value.ShouldBeInRange(DateTimeOffset.UtcNow.AddSeconds(-1), DateTimeOffset.UtcNow);
  }

  [Fact]
  public void UpdateStateSetsLastUpdatedIfFeaturesAreNotProvided()
  {
    var featureBoardState = Services.Resolve<IFeatureBoardState>();
    featureBoardState.UpdateState(null, null, CancellationToken.None);

    featureBoardState.LastUpdated.ShouldNotBeNull();
    featureBoardState.LastUpdated.Value.ShouldBeInRange(DateTimeOffset.UtcNow.AddSeconds(-1), DateTimeOffset.UtcNow);
  }

  [Fact]
  public void UpdateStateDoesNotSetETagIfFeaturesAreNotProvided()
  {
    var featureConfiguration = CreateFeature();
    var eTagFirst = DateTimeOffset.UtcNow.ToString();
    var eTagSecond = DateTimeOffset.UtcNow.AddSeconds(1).ToString();

    var featureBoardState = Services.Resolve<IFeatureBoardState>();
    featureBoardState.UpdateState(new List<FeatureConfiguration> { featureConfiguration }, eTagFirst, CancellationToken.None);

    featureBoardState.UpdateState(null, eTagSecond, CancellationToken.None);

    featureBoardState.ETag.ShouldBe(eTagFirst);
  }

  [Fact]
  public void UpdateStateSetsETagFeaturesAreProvided()
  {
    var featureConfiguration = CreateFeature();
    var eTag = DateTimeOffset.UtcNow.ToString();

    var featureBoardState = Services.Resolve<IFeatureBoardState>();
    featureBoardState.UpdateState(new List<FeatureConfiguration>
        { featureConfiguration }, eTag,
      CancellationToken.None);

    featureBoardState.ETag.ShouldNotBeNull();
    featureBoardState.ETag.ShouldBe(eTag);
  }



  [Fact]
  public void UpdateStateShouldUpdateStateIfFeaturesAreProvided()
  {
    var featureConfiguration = CreateFeature();
    var featureBoardState = Services.Resolve<IFeatureBoardState>();
    featureBoardState.UpdateState(new List<FeatureConfiguration> { featureConfiguration }, DateTimeOffset.UtcNow.ToString(), CancellationToken.None);

    var resolvedFeature = featureBoardState.GetSnapshot().Get(featureConfiguration.FeatureKey);
    resolvedFeature.ShouldBe(featureConfiguration);
  }

  [Fact]
  public void UpdateStateUpdatesExternalStateIfFeaturesAreProvided()
  {
    var featureConfiguration = CreateFeature();
    var featureBoardState = Services.Resolve<IFeatureBoardState>();
    featureBoardState.UpdateState(new List<FeatureConfiguration> { featureConfiguration }, DateTimeOffset.UtcNow.ToString(), CancellationToken.None);


    var featureBoardExternalStateMock = Services.Resolve<Mock<IFeatureBoardExternalState>>();
    featureBoardExternalStateMock.Verify(x => x.UpdateState(It.IsAny<List<FeatureConfiguration>>(), It.IsAny<CancellationToken>()), Times.Once);
  }

  [Fact]
  public void UpdateStateShouldNotUpdateStateIfFeaturesAreNotProvided()
  {
    var featureConfiguration = CreateFeature();
    var featureBoardState = Services.Resolve<IFeatureBoardState>();
    featureBoardState.InitialiseState(new List<FeatureConfiguration> { featureConfiguration }, DateTimeOffset.UtcNow.ToString(), CancellationToken.None);
    featureBoardState.UpdateState(null, null, CancellationToken.None);

    var resolvedFeature = featureBoardState.GetSnapshot().Get(featureConfiguration.FeatureKey);
    resolvedFeature.ShouldBe(featureConfiguration);
  }

  [Fact]
  public void UpdateStateShouldNotUpdateExternalStateIfFeaturesAreNotProvided()
  {
    var featureConfiguration = CreateFeature();
    var featureBoardState = Services.Resolve<IFeatureBoardState>();
    featureBoardState.InitialiseState(new List<FeatureConfiguration> { featureConfiguration }, DateTimeOffset.UtcNow.ToString(), CancellationToken.None);

    var featureBoardExternalStateMock = Services.Resolve<Mock<IFeatureBoardExternalState>>();
    featureBoardExternalStateMock.Invocations.Clear();

    featureBoardState.UpdateState(null, null, CancellationToken.None);

    featureBoardExternalStateMock.Verify(x => x.UpdateState(It.IsAny<List<FeatureConfiguration>>(), It.IsAny<CancellationToken>()), Times.Never);
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
