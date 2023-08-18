using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace FeatureBoard.DotnetSdk.UpdateStrategies;

public class OnRequestUpdateStrategyMiddleware : IMiddleware
{
  private readonly IFeatureBoardService _featureBoardService;
  private readonly ILogger _logger;

  public OnRequestUpdateStrategyMiddleware(IFeatureBoardService featureBoardService, ILogger<OnRequestUpdateStrategyMiddleware> logger)
  {
    _featureBoardService = featureBoardService;
    _logger = logger;
  }

  public async Task InvokeAsync(HttpContext context, RequestDelegate next)
  {
    await _featureBoardService.RefreshFeatureConfiguration(context.RequestAborted);

    await next(context);
  }
}
