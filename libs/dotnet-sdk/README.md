
## What is FeatureBoard?

FeatureBoard is the future of Feature Toggling and is tailored for SaaS teams on the hunt for a simplified yet highly potent feature toggling solution. FeatureBoard enhances team productivity by allowing everyone to manage software features seamlessly, not just developers.

## How do I get started?

To get started checkout our [getting started guide](https://docs.featureboard.app).

## Install FeatureBoard .Net SDK

FeatureBoard .Net SDK is installed from NuGet. 

2) Implement the audience provider.
This should provide the audience of the current user or application context and could pull from the users token or app settings etc.
```csharp
using FeatureBoard.DotnetSdk;

public class ClaimsAudienceProvider : IAudienceProvider
{
  public List<string> AudienceKeys { get; }

  public ClaimsAudienceProvider(IHttpContextAccessor contextAccessor)
  {
    AudienceKeys = contextAccessor.HttpContext?.User.Claims
      .Where(x => x.Type == "audience")
      .Select(x => x.Value).ToList() ?? new List<string>();
  }
}
```

## Setup and example

How to setup and use FeatureBoard .Net SDK can be found in our [documentation](https://docs.featureboard.app/sdks/dotnet-sdk/). 

## Release notes

5) Add the enviroment key to your appsettings.json file
```json
{
    ....
    "AllowedHosts": "*",
    "FeatureBoardOptions": {
        "EnvironmentApiKey": "YOUR KEY HERE"
    }
}
```



## Usage 
The FeatureBoard client can be injected into your class or controller with dependant injection and used directly to reolve features for the current users audance.
```csharp
[ApiController]
[Route("[controller]")]
public class IconController : ControllerBase
{

  private readonly IFeatureBoardClient<Features> _featureBoardClient;
  private readonly IFeatureBoardClient<Features> _featureBoardClient;

  public IconController(ILogger<IconController> logger, IFeatureBoardClient<Features> featureBoardClient)
  {
    _featureBoardClient = featureBoardClient;
  }

  [HttpPut(Name = "Icons")]
  public IActionResult Put(IconUpdate update)
  {
    if (!_featureBoardClient.GetFeatureValue(features => features.AllowEdits, false))
    {
      return Unauthorized();
    }
    _repository.UpdateIcon(update)
  }
}
```

Or if you have generated your features model though the cli you can use the generated Attributes to limit access
```csharp
[ApiController]
[Route("[controller]")]
public class IconController : ControllerBase
{s
  private readonly IRepository _repository;

  public IconController(ILogger<IconController> logger, IRepository _repository)
  {
    _featureBoardClient = featureBoardClient;
  }

  [HttpPut(Name = "Icons")]
  [FeatureFilter(BooleanFeature.AllowEdits, false)]
  public IActionResult Put(IconUpdate update)
  {
    _repository.UpdateIcon(update)
  }
}
```


## External State Store
You can create an external state to provide state in case that feature board is unavilable by implementing `IFeatureBoardExternalState`

```csharp
using FeatureBoard.DotnetSdk.Models;
using FeatureBoard.DotnetSdk.States;

public class MyExternalState: IFeatureBoardExternalState
{
  public Task<Dictionary<string, FeatureConfiguration>> GetState(CancellationToken cancellationToken)
  {....}

  public Task UpdateState(Dictionary<string, FeatureConfiguration>? features, CancellationToken cancellationToken)
  {....}
}
```

And registering it in `program.cs`

```csharp
builder.Services.AddFeatureBoard<WeatherFeatures, QueryStringAudienceProvider>()
  .WithPollingUpdateStrategy()
  .WithExternalState<MyExternalState>();
```
