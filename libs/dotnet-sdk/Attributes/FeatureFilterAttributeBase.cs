using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace FeatureBoard.DotnetSdk.Attributes;

public abstract class FeatureFilterAttributeBase : ActionFilterAttribute, IAsyncPageFilter
{
  protected abstract string Feature { get; }
  protected abstract object DefaultValue { get; }
  protected abstract object? IsEqualTo { get; }

  public Task OnPageHandlerSelectionAsync(PageHandlerSelectedContext context) => Task.CompletedTask;


  public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
  {
    if (CanAccess(context))
      await next().ConfigureAwait(false);
    else
      context.Result = new NotFoundResult();
  }

  public async Task OnPageHandlerExecutionAsync(PageHandlerExecutingContext context, PageHandlerExecutionDelegate next)
  {
    if (CanAccess(context))
      await next().ConfigureAwait(false);
    else
      context.Result = new NotFoundResult();
  }

  private bool CanAccess(FilterContext context)
  {
    var featureBoardClient = context.HttpContext.RequestServices.GetRequiredService<IFeatureBoardClient>();
    bool flag;
    switch (DefaultValue)
    {
      case bool boolDefault:
        {
          var result = featureBoardClient.GetFeatureValue(Feature, boolDefault);
          flag = result == (IsEqualTo as bool? ?? true);
          break;
        }
      case string stringDefault:
        {
          var result = featureBoardClient.GetFeatureValue(Feature, stringDefault);
          flag = result == IsEqualTo as string;
          break;
        }
      case decimal decimalDefault:
        {
          var result = featureBoardClient.GetFeatureValue(Feature, decimalDefault);
          flag = result == IsEqualTo as decimal?;
          break;
        }
      default:
        throw new NotSupportedException(
          $"Type {DefaultValue.GetType().Name} is not supported by FeatureFilterAttribute");
    }

    return flag;
  }
}
