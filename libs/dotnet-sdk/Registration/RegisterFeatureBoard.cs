using System.Net.Http.Headers;
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

  private static EntityTagHeaderValue? lastETag = null;
  private static RetryConditionHeaderValue? retryAfter = null;

  public static FeatureBoardBuilder AddFeatureBoard<TFeatures>(this IServiceCollection services, IConfigurationRoot configuration) where TFeatures : class, IFeatures
  {
    services.AddOptions<FeatureBoardOptions>().Bind(configuration.GetSection(nameof(FeatureBoardOptions))).ValidateDataAnnotations();

    services.AddHttpClient<IFeatureBoardHttpClient, FeatureBoardHttpClient>().ConfigureHttpClient(static (serviceProvider, client) =>
    {
      var options = serviceProvider.GetRequiredService<IOptions<FeatureBoardOptions>>();
      client.BaseAddress = options.Value.HttpEndpoint;
      client.DefaultRequestHeaders.Add("x-environment-key", options.Value.EnvironmentApiKey);
      // client.Timeout = options.Value.MaxAge - TimeSpan.FromMilliseconds(3); //prevent multiple requests running at the same time.
    });

    services.AddSingleton<LastETagProvider>(() => ref lastETag);
    services.AddSingleton<RetryAfterProvider>(() => ref retryAfter);

    services.AddScoped<IFeatureBoardClient<TFeatures>, FeatureBoardClient<TFeatures>>();
    services.AddScoped<IFeatureBoardClient>(static c => c.GetRequiredService<IFeatureBoardClient<TFeatures>>());

    services.AddSingleton<FeatureBoardState>();
    services.AddHostedService(static provider => provider.GetRequiredService<FeatureBoardState>());
    services.AddTransient<Action<IReadOnlyCollection<FeatureConfiguration>>>(static provider => provider.GetRequiredService<FeatureBoardState>().Update);
    services.AddScoped(static provider => provider.GetRequiredService<FeatureBoardState>().GetSnapshot());

    return new FeatureBoardBuilder(services);
  }

  private static DateTimeOffset lastChecked = DateTimeOffset.MinValue;

  public static FeatureBoardBuilder WithOnRequestUpdateStrategy(this FeatureBoardBuilder builder)
  {
    if (_updateStrategy != UpdateStrategy.None)
      throw new ApplicationException("You can only have one update strategy registered");
    builder.Services.AddTransient<OnRequestUpdateStrategyMiddleware>();
    builder.Services.AddScoped<FeatureBoardService>();
    builder.Services.AddScoped<IFeatureBoardService, FeatureBoardLastCheckedService>();
    builder.Services.AddSingleton<LastCheckedTimeProvider>(() => ref lastChecked);
    builder.Services.AddSingleton<Func<DateTimeOffset>>(() => DateTimeOffset.UtcNow);

    _updateStrategy = UpdateStrategy.OnRequest;

    return builder;
  }

  public static FeatureBoardBuilder WithPollingUpdateStrategy(this FeatureBoardBuilder builder)
  {
    if (_updateStrategy != UpdateStrategy.None)
      throw new ApplicationException("You can only have one update strategy registered");
    builder.Services.AddHostedService<PollingUpdateStrategyBackgroundService>();
    builder.Services.AddScoped<IFeatureBoardService, FeatureBoardService>();

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
