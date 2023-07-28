using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.State;
using FeatureBoard.DotnetSdk.UpdateStrategies;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace FeatureBoard.DotnetSdk.Registration;

public static class RegisterFeatureBoard
{
  private static UpdateStrategy _updateStrategy = UpdateStrategy.None;
  public static FeatureBoardBuilder AddFeatureBoard<TFeatures, TAudienceProvider>(this IServiceCollection services) where TFeatures : class, IFeatures where TAudienceProvider : class, IAudienceProvider
  {
    var configuration = services.BuildServiceProvider().GetRequiredService<IConfiguration>();
    services.AddOptions<FeatureBoardOptions>().Bind(configuration.GetSection(nameof(FeatureBoardOptions))).ValidateDataAnnotations();

    services.AddHttpClient<IFeatureBoardHttpClient, FeatureBoardHttpClient>().ConfigureHttpClient((serviceProvider, client) =>
    {
      var options = serviceProvider.GetRequiredService<IOptions<FeatureBoardOptions>>();
      client.BaseAddress = options.Value.HttpEndpoint;
      client.DefaultRequestHeaders.Add("x-environment-key", options.Value.EnvironmentApiKey);
      client.Timeout = options.Value.MaxAge - TimeSpan.FromMilliseconds(3); //prevent multiple requests running at the same time.
    });

    services.AddScoped<IFeatureBoardClient<TFeatures>, FeatureBoardClient<TFeatures>>();
    services.AddScoped<IFeatureBoardClient>(c => c.GetRequiredService<IFeatureBoardClient<TFeatures>>());
    services.AddScoped<IAudienceProvider, TAudienceProvider>();
    services.AddSingleton<IFeatureBoardState, FeatureBoardState>();

    return new FeatureBoardBuilder(services);
  }

  public static FeatureBoardBuilder WithOnRequestUpdateStrategy(this FeatureBoardBuilder builder)
  {
    if (_updateStrategy != UpdateStrategy.None)
      throw new ApplicationException("You can only have one update strategy registered");
    builder.Services.AddTransient<OnRequestUpdateStrategyMiddleware>();

    _updateStrategy = UpdateStrategy.OnRequest;

    return builder;
  }

  public static FeatureBoardBuilder WithPollingUpdateStrategy(this FeatureBoardBuilder builder)
  {
    if (_updateStrategy != UpdateStrategy.None)
      throw new ApplicationException("You can only have one update strategy registered");
    builder.Services.AddHostedService<PollingUpdateStrategyBackgroundService>();

    _updateStrategy = UpdateStrategy.Polling;

    return builder;
  }

  public static FeatureBoardBuilder WithExternalState<TStateStore>(this FeatureBoardBuilder builder) where TStateStore : class, IFeatureBoardExternalState
  {
    builder.Services.AddSingleton<IFeatureBoardExternalState, TStateStore>();

    return builder;
  }

  public static IApplicationBuilder UseFeatureBoard(this IApplicationBuilder builder)
  {
    return _updateStrategy switch
    {
      UpdateStrategy.OnRequest => builder.UseMiddleware<OnRequestUpdateStrategyMiddleware>(),
      _ => builder
    };
  }

  private enum UpdateStrategy
  {
    None,
    Polling,
    OnRequest
  }
}
