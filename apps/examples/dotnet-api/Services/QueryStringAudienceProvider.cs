using FeatureBoard.DotnetSdk;

namespace FeatureBoardSdk.Examples.DotnetApi.Services;

public class QueryStringAudienceProvider : IAudienceProvider
{
  public List<string> AudienceKeys { get; }

  public QueryStringAudienceProvider(IHttpContextAccessor contextAccessor)
  {
    if (contextAccessor.HttpContext?.Request.Query.TryGetValue("audience", out var audienceKeys) ?? false)
    {
      AudienceKeys = audienceKeys.Where(string.IsNullOrWhiteSpace).ToList()!;
      return;
    }

    AudienceKeys = new List<string>();
  }
}
