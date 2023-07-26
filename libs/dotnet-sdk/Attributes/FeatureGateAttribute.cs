using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace FeatureBoard.DotnetSdk.Attributes;

public abstract class FeatureGateAttributeBase : ActionFilterAttribute, IAsyncPageFilter
{
  protected abstract string Feature { get; }
  protected abstract bool DefaultValue { get; }

  public Task OnPageHandlerSelectionAsync(PageHandlerSelectedContext context) => Task.CompletedTask;


  public override async Task OnActionExecutionAsync(
    ActionExecutingContext context,
    ActionExecutionDelegate next)
  {
    var featureBoardClient = context.HttpContext.RequestServices.GetRequiredService<IFeatureBoardClient>();
    var flag = featureBoardClient.GetFeatureValue(Feature, DefaultValue);
    if (flag)
      await next().ConfigureAwait(false);
    else
      context.Result = new NotFoundResult();
  }

  public async Task OnPageHandlerExecutionAsync(PageHandlerExecutingContext context, PageHandlerExecutionDelegate next)
  {
    var featureBoardClient = context.HttpContext.RequestServices.GetRequiredService<IFeatureBoardClient>();
    var flag = featureBoardClient.GetFeatureValue(Feature, DefaultValue);
    if (flag)
      await next().ConfigureAwait(false);
    else
      context.Result = new NotFoundResult();
  }

}
