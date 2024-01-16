using System.Net.Http.Headers;
using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.State;
using FeatureBoard.DotnetSdk.UpdateStrategies;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Polly;

namespace FeatureBoard.DotnetSdk.Registration;

public static class RegisterFeatureBoard
{
  private static UpdateStrategy _updateStrategy = UpdateStrategy.None;

  private static EntityTagHeaderValue? lastETag = null;

  public static FeatureBoardBuilder AddFeatureBoard<TFeatures>(this IServiceCollection services, IConfigurationRoot configuration) where TFeatures : class, IFeatures
  {
    services.AddOptions<FeatureBoardOptions>().Bind(configuration.GetSection(nameof(FeatureBoardOptions))).ValidateDataAnnotations();

    services.AddHttpClient<IFeatureBoardHttpClient, FeatureBoardHttpClient>().ConfigureHttpClient(static (serviceProvider, client) =>
    {
      var options = serviceProvider.GetRequiredService<IOptions<FeatureBoardOptions>>();
      client.BaseAddress = options.Value.HttpEndpoint;
      client.DefaultRequestHeaders.Add("x-environment-key", options.Value.EnvironmentApiKey);
      // client.Timeout = options.Value.MaxAge - TimeSpan.FromMilliseconds(3); //prevent multiple requests running at the same time.
    }).AddTransientHttpErrorPolicy(static policyBuilder => // DEBT: Get number retries from config
      policyBuilder.WaitAndRetryAsync(retryCount: 5, static retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))) // TODO: Consider adding jitter
    );

    services.AddSingleton<LastETagProvider>(() => ref lastETag);

    services.AddScoped<IFeatureBoardClient<TFeatures>, FeatureBoardClient<TFeatures>>()
      .AddScoped<IFeatureBoardClient>(static c => c.GetRequiredService<IFeatureBoardClient<TFeatures>>());

    services.AddSingleton<FeatureBoardState>()
      .AddHostedService(static provider => provider.GetRequiredService<FeatureBoardState>())
      .AddScoped(static provider => new Lazy<FeatureBoardStateSnapshot>(provider.GetRequiredService<FeatureBoardState>().GetSnapshot))
      .AddTransient<IFeatureBoardStateUpdateHandler, FeatureBoardStateUpdater>();

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
    builder.Services.AddSingleton<IFeatureBoardExternalState, TStateStore>()
      .AddTransient<IFeatureBoardStateUpdateHandler>(static provider => provider.GetRequiredService<IFeatureBoardExternalState>());

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
