using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace FeatureBoard.DotnetSdk.Test.Extensions
{
  internal static class ServiceCollectionExtensions
  {
    public static IServiceCollection AddServiceMock<T>(this IServiceCollection services, Action<IServiceProvider, Mock<T>>? configureMock = null, ServiceLifetime lifetime = ServiceLifetime.Transient) where T : class
    {
      services.Add(new ServiceDescriptor(typeof(T), provider =>
      {
        var mock = new Mock<T>();
        configureMock?.Invoke(provider, mock);
        return mock.Object;
      }, lifetime));

      return services;
    }
  }
}
