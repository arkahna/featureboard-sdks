using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace FeatureBoard.DotnetSdk.Test;

public class TestServiceResolver
{
  private readonly ServiceCollection _services;
  private ServiceProvider? _serviceProvider;

  public TestServiceResolver()
  {
    _services = new ServiceCollection();
  }

  public Mock<T> AddServiceMock<T>() where T : class
  {
    _serviceProvider = null;

    var mock = new Mock<T>();
    _services.AddSingleton(mock);
    _services.AddSingleton(mock.Object);

    return mock;
  }
  public T Resolve<T>() => (T)Resolve(typeof(T));

  private object Resolve(Type requiredService)
  {
    var serviceProvider = _serviceProvider ??= _services.BuildServiceProvider();

    var service = serviceProvider.GetService(requiredService);

    // ReSharper disable once ConditionIsAlwaysTrueOrFalseAccordingToNullableAPIContract // This is not actually always not null :(
    if (service is not null)
      return service;

    _serviceProvider = null;
    _services.AddSingleton(requiredService);

    return Resolve(requiredService);
  }

  public void AddService<TService, TImplementation>()
      where TService : class
      where TImplementation : class, TService
  {
    _serviceProvider = null;
    _services.AddSingleton<TService, TImplementation>();
  }

  public void AddService<TService>(TService implementation)
      where TService : class
  {
    _serviceProvider = null;
    _services.AddSingleton(implementation);
  }

  public void AddService<TService>(Func<IServiceProvider, TService> implementationFactory)
      where TService : class
  {
    _serviceProvider = null;
    _services.AddSingleton(implementationFactory);
  }

  public void AddService(Type service, Type implementation)
  {
    _serviceProvider = null;
    _services.AddSingleton(service, implementation);
  }

}
