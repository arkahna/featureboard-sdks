using Bogus;
using FeatureBoard.DotnetSdk.Helpers;
using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.State;
using Moq;
using Shouldly;
using System.Text.Json.Nodes;

namespace FeatureBoard.DotnetSdk.Test;

public class FeatureBoardClientTests : SdkTestsBase
{
  public FeatureBoardClientTests()
  {
    Services.AddService<IFeatureBoardClient<TestFeatures>, FeatureBoardClient<TestFeatures>>();

    var audienceMock = Services.AddServiceMock<IAudienceProvider>();
    audienceMock.Setup(x => x.AudienceKeys).Returns(new List<string> { "an-audience" });

    Services.AddServiceMock<IFeatureBoardState>();
  }


  [Fact]
  public void ItReturnsTheDefaultValueWhenNoValueIsFound()
  {
    var featureBoardMock = Services.Resolve<Mock<IFeatureBoardState>>();
    featureBoardMock.Setup(x => x.GetSnapshot()).Returns(new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>(0)));

    var client = Services.Resolve<IFeatureBoardClient<TestFeatures>>();

    var defaultValue = Guid.NewGuid().ToString();
    var result = client.GetFeatureValue(x => x.StringFeature, defaultValue);
    result.ShouldBe(defaultValue);
  }


  [Fact]
  public void ItReturnsTheDefaultValueFromFeatureBoardWhenNoAudienceIsFound()
  {
    var faker = new Faker();
    var defaultFeatureValue = faker.Lorem.Sentence();
    var featureBoardMock = Services.Resolve<Mock<IFeatureBoardState>>();
    featureBoardMock
      .Setup(x => x.GetSnapshot())
      .Returns(new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>
      {
        {
          nameof(TestFeatures.StringFeature).ToFeatureBoardKey(), new FeatureConfiguration
          {
            DefaultValue = JsonValue.Create(defaultFeatureValue)!,
            FeatureKey = nameof(TestFeatures.StringFeature),
            AudienceExceptions = Array.Empty<AudienceExceptionValue>()
          }
        }
      }));

    var client = Services.Resolve<IFeatureBoardClient<TestFeatures>>();

    var result = client.GetFeatureValue(x => x.StringFeature, Guid.NewGuid().ToString());
    result.ShouldBe(defaultFeatureValue);
  }

  [Fact]
  public void ItReturnsTheAudienceValueFromFeatureBoardWhenAnAudienceIsFound()
  {
    var faker = new Faker();
    var defaultAudienceValue = faker.Lorem.Paragraph();
    var featureBoardMock = Services.Resolve<Mock<IFeatureBoardState>>();
    featureBoardMock
      .Setup(x => x.GetSnapshot())
      .Returns(new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>
      {
        {
          nameof(TestFeatures.StringFeature).ToFeatureBoardKey(), new FeatureConfiguration
          {
            DefaultValue = JsonValue.Create(faker.Lorem.Paragraph())!,
            FeatureKey = nameof(TestFeatures.StringFeature),
            AudienceExceptions = new AudienceExceptionValue[]{
              new()
              {
                Value = JsonValue.Create(defaultAudienceValue)!,
                AudienceKey = "an-audience"
              }
            }
          }
        }
      }));

    var client = Services.Resolve<IFeatureBoardClient<TestFeatures>>();

    var result = client.GetFeatureValue(x => x.StringFeature, Guid.NewGuid().ToString());
    result.ShouldBe(defaultAudienceValue);
  }

  [Fact]
  public void ItReturnsADecimal()
  {
    var faker = new Faker();
    var defaultAudienceValue = faker.Random.Decimal();
    var featureBoardMock = Services.Resolve<Mock<IFeatureBoardState>>();
    featureBoardMock
      .Setup(x => x.GetSnapshot())
      .Returns(new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>
      {
        {
          nameof(TestFeatures.NumberFeature).ToFeatureBoardKey(), new FeatureConfiguration
          {
            DefaultValue = JsonValue.Create(faker.Random.Decimal()),
            FeatureKey = nameof(TestFeatures.NumberFeature),
            AudienceExceptions = new AudienceExceptionValue[]{
              new()
              {
                Value = JsonValue.Create(defaultAudienceValue),
                AudienceKey = "an-audience"
              }
            }
          }
        }
      }));

    var client = Services.Resolve<IFeatureBoardClient<TestFeatures>>();

    var result = client.GetFeatureValue(x => x.NumberFeature, 0);
    result.ShouldBe(defaultAudienceValue);
  }


  [Fact]
  public void ItReturnsABool()
  {
    var faker = new Faker();
    var defaultAudienceValue = faker.Random.Bool();
    var featureBoardMock = Services.Resolve<Mock<IFeatureBoardState>>();
    featureBoardMock
      .Setup(x => x.GetSnapshot())
      .Returns(new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>
      {
        {
          nameof(TestFeatures.BoolFeature).ToFeatureBoardKey(), new FeatureConfiguration
          {
            DefaultValue = JsonValue.Create(!defaultAudienceValue),
            FeatureKey = nameof(TestFeatures.BoolFeature),
            AudienceExceptions = new AudienceExceptionValue[]{
              new()
              {
                Value = JsonValue.Create(defaultAudienceValue),
                AudienceKey = "an-audience"
              }
            }
          }
        }
      }));

    var client = Services.Resolve<IFeatureBoardClient<TestFeatures>>();

    var result = client.GetFeatureValue(x => x.BoolFeature, !defaultAudienceValue);
    result.ShouldBe(defaultAudienceValue);
  }

  [Fact]
  public void ItReturnsAString()
  {
    var faker = new Faker();
    var defaultAudienceValue = Guid.NewGuid().ToString();
    var featureBoardMock = Services.Resolve<Mock<IFeatureBoardState>>();
    featureBoardMock
      .Setup(x => x.GetSnapshot())
      .Returns(new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>
      {
        {
          nameof(TestFeatures.StringFeature).ToFeatureBoardKey(), new FeatureConfiguration
          {
            DefaultValue = JsonValue.Create(faker.Lorem.Paragraph())!,
            FeatureKey = nameof(TestFeatures.StringFeature),
            AudienceExceptions = new AudienceExceptionValue[]{
              new()
              {
                Value = JsonValue.Create(defaultAudienceValue)!,
                AudienceKey = "an-audience"
              }
            }
          }
        }
      }));

    var client = Services.Resolve<IFeatureBoardClient<TestFeatures>>();
    var result = client.GetFeatureValue(x => x.StringFeature, Guid.NewGuid().ToString());

    result.ShouldBe(defaultAudienceValue);
  }

  [Fact]
  public void ItReturnsAnEnum()
  {
    var faker = new Faker();
    var defaultAudienceValue = faker.PickRandom<TestEnum>();
    var featureBoardMock = Services.Resolve<Mock<IFeatureBoardState>>();
    featureBoardMock
      .Setup(x => x.GetSnapshot())
      .Returns(new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>
      {
        {
          nameof(TestFeatures.EnumFeature).ToFeatureBoardKey(), new FeatureConfiguration
          {
            DefaultValue = JsonValue.Create(faker.PickRandomWithout(defaultAudienceValue).ToString().ToLower())!,
            FeatureKey = nameof(TestFeatures.EnumFeature),
            AudienceExceptions = new AudienceExceptionValue[]{
              new()
              {
                Value = JsonValue.Create(defaultAudienceValue.ToString().ToLower())!,
                AudienceKey = "an-audience"
              }
            }
          }
        }
      }));

    var client = Services.Resolve<IFeatureBoardClient<TestFeatures>>();
    var result = client.GetFeatureValue(x => x.EnumFeature, faker.PickRandomWithout(defaultAudienceValue));

    result.ShouldBe(defaultAudienceValue);
  }


  [Fact]
  public void ItLooksUpTheFeatureKeyWithFeatureKeyNameAttribute()
  {
    var faker = new Faker();
    var defaultAudienceValue = Guid.NewGuid().ToString();
    var featureBoardMock = Services.Resolve<Mock<IFeatureBoardState>>();
    featureBoardMock
      .Setup(x => x.GetSnapshot())
      .Returns(new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>
      {
        {
          "a-strange-name", new FeatureConfiguration
          {
            DefaultValue = JsonValue.Create(faker.Lorem.Paragraph())!,
            FeatureKey = nameof(TestFeatures.StringFeature),
            AudienceExceptions = new AudienceExceptionValue[]{
              new()
              {
                Value = JsonValue.Create(defaultAudienceValue)!,
                AudienceKey = "an-audience"
              }
            }
          }
        }
      }));

    var client = Services.Resolve<IFeatureBoardClient<TestFeatures>>();
    var result = client.GetFeatureValue(x => x.StrangeName, Guid.NewGuid().ToString());

    result.ShouldBe(defaultAudienceValue);
  }
}
