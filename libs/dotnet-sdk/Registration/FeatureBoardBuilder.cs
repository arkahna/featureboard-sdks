using Microsoft.Extensions.DependencyInjection;

namespace FeatureBoard.DotnetSdk.Registration;

public class FeatureBoardBuilder
{
  internal IServiceCollection Services { get; }

  public FeatureBoardBuilder(IServiceCollection services)
  {
    Services = services;
  }
}
