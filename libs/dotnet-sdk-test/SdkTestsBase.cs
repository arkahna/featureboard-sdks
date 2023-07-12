using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace FeatureBoard.DotnetSdk.Test;

public abstract class SdkTestsBase
{
  protected TestServiceResolver Services { get; }

  protected SdkTestsBase()
  {
    Services = new TestServiceResolver();
    Services.AddService(typeof(ILogger<>), typeof(NullLogger<>));
  }
}
