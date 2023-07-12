## DotNet SDK

## Installation

```powershell
dotnet add package FeatureBoard.DotnetSdk
```


## Setup

1) Create a Features model
```csharp
using FeatureBoard.DotnetSdk.Models;

public class WeatherFeatures : IFeatures
{
  public bool WeatherImperial { get; set; }
}
```

2) Implement the audiance provider.
This should provide the audiance of the current user or application context and could pull from the users token or app settings etc.
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


3) Register the provider in `program.cs`
```csharp
// Register feature board
builder.Services.AddFeatureBoard<WeatherFeatures, ClaimsAudienceProvider>()
  .WithPollingUpdateStrategy();
```

4) Add any required middleware
```csharp
// Add feature board middleware
app.UseFeatureBoard();
```

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
```csharp
using FeatureBoard.DotnetSdk;
using FeatureBoardSdks.Examples.DotnetApi.Models;
using Microsoft.AspNetCore.Mvc;

namespace FeatureBoardSdks.Examples.DotnetApi.Controllers;

[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{

  private readonly IFeatureBoardClient<WeatherFeatures> _featureBoardClient;

  public WeatherForecastController(ILogger<WeatherForecastController> logger, IFeatureBoardClient<WeatherFeatures> featureBoardClient)
  {
    _featureBoardClient = featureBoardClient;
  }

  [HttpGet(Name = "GetWeatherForecast")]
  public async Task<ActionResult<WeatherForecast[]>> Get()
  {
    if (_featureBoardClient.GetFeatureValue(features => features.WeatherImperial, false))
    {
      // Return Fahrenheit
    }
    else
    {
      // Return Celsius
    }
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
