using System.Text.Json.Nodes;
using FeatureBoard.DotnetSdk.Test.Extensions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Bogus;
using Shouldly;
using FeatureBoard.DotnetSdk.Helpers;
using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.State;

namespace FeatureBoard.DotnetSdk.Test;

public class FeatureBoardClientTests
{
  private readonly IServiceCollection Services = new ServiceCollection();

  public FeatureBoardClientTests()
  {
    Services.AddTransient(typeof(ILogger<>), typeof(NullLogger<>));
    Services.AddTransient(typeof(Lazy<>));
    Services.AddTransient<FeatureBoardClient<TestFeatures>>();

    var audienceMock = Services.AddServiceMock<IAudienceProvider>((_, mock) =>
      mock.Setup(x => x.AudienceKeys).Returns(new List<string> { "an-audience" })
    );
  }


  [Fact]
  public void ItReturnsTheDefaultValueWhenNoValueIsFound()
  {
    Services.AddTransient<FeatureBoardStateSnapshot>(_ => new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>(0)));

    var client = Services.BuildServiceProvider().GetRequiredService<FeatureBoardClient<TestFeatures>>();

    var defaultValue = Guid.NewGuid().ToString();
    var result = client.GetFeatureValue(x => x.StringFeature, defaultValue);
    result.ShouldBe(defaultValue);
  }


  [Fact]
  public void ItReturnsTheDefaultValueFromFeatureBoardWhenNoAudienceIsFound()
  {
    var faker = new Faker();
    var defaultFeatureValue = faker.Lorem.Sentence();
    Services.AddTransient<FeatureBoardStateSnapshot>(_ => new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>
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
    var client = Services.BuildServiceProvider().GetRequiredService<FeatureBoardClient<TestFeatures>>();

    var result = client.GetFeatureValue(x => x.StringFeature, Guid.NewGuid().ToString());
    result.ShouldBe(defaultFeatureValue);
  }

  [Fact]
  public void ItReturnsTheAudienceValueFromFeatureBoardWhenAnAudienceIsFound()
  {
    var faker = new Faker();
    var defaultAudienceValue = faker.Lorem.Paragraph();
    Services.AddTransient<FeatureBoardStateSnapshot>(_ => new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>
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

    var client = Services.BuildServiceProvider().GetRequiredService<FeatureBoardClient<TestFeatures>>();

    var result = client.GetFeatureValue(x => x.StringFeature, Guid.NewGuid().ToString());
    result.ShouldBe(defaultAudienceValue);
  }

  [Fact]
  public void ItReturnsADecimal()
  {
    var faker = new Faker();
    var defaultAudienceValue = faker.Random.Decimal();
    Services.AddTransient<FeatureBoardStateSnapshot>(_ => new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>
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

    var client = Services.BuildServiceProvider().GetRequiredService<FeatureBoardClient<TestFeatures>>();

    var result = client.GetFeatureValue(x => x.NumberFeature, 0);
    result.ShouldBe(defaultAudienceValue);
  }


  [Fact]
  public void ItReturnsABool()
  {
    var faker = new Faker();
    var defaultAudienceValue = faker.Random.Bool();
    Services.AddTransient<FeatureBoardStateSnapshot>(_ => new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>      {
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

    var client = Services.BuildServiceProvider().GetRequiredService<FeatureBoardClient<TestFeatures>>();

    var result = client.GetFeatureValue(x => x.BoolFeature, !defaultAudienceValue);
    result.ShouldBe(defaultAudienceValue);
  }

  [Fact]
  public void ItReturnsAString()
  {
    var faker = new Faker();
    var defaultAudienceValue = Guid.NewGuid().ToString();
    Services.AddTransient<FeatureBoardStateSnapshot>(_ => new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>
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

    var client = Services.BuildServiceProvider().GetRequiredService<FeatureBoardClient<TestFeatures>>();
    var result = client.GetFeatureValue(x => x.StringFeature, Guid.NewGuid().ToString());

    result.ShouldBe(defaultAudienceValue);
  }

  [Fact]
  public void ItReturnsAnEnum()
  {
    var faker = new Faker();
    var defaultAudienceValue = faker.PickRandom<TestEnum>();
    Services.AddTransient<FeatureBoardStateSnapshot>(_ => new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>      {
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

    var client = Services.BuildServiceProvider().GetRequiredService<FeatureBoardClient<TestFeatures>>();
    var result = client.GetFeatureValue(x => x.EnumFeature, faker.PickRandomWithout(defaultAudienceValue));

    result.ShouldBe(defaultAudienceValue);
  }


  [Fact]
  public void ItLooksUpTheFeatureKeyWithFeatureKeyNameAttribute()
  {
    var faker = new Faker();
    var defaultAudienceValue = Guid.NewGuid().ToString();
    Services.AddTransient<FeatureBoardStateSnapshot>(_ => new FeatureBoardStateSnapshot(new Dictionary<string, FeatureConfiguration>      {
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

    var client = Services.BuildServiceProvider().GetRequiredService<FeatureBoardClient<TestFeatures>>();
    var result = client.GetFeatureValue(x => x.StrangeName, Guid.NewGuid().ToString());

    result.ShouldBe(defaultAudienceValue);
  }
}
