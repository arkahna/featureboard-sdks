using FeatureBoard.DotnetSdk.Attributes;
using FeatureBoard.DotnetSdk.Models;
using System.Runtime.Serialization;

namespace FeatureBoardSdk.Examples.DotnetApi;

// Features
public class Features : IFeatures
{
  [FeatureKeyName("organization-management")]
  public bool OrganizationManagement { get; set; }
  [FeatureKeyName("projects-write")]
  public bool ProjectsWrite { get; set; }
  [FeatureKeyName("environments-write")]
  public bool EnvironmentsWrite { get; set; }
  [FeatureKeyName("features-write")]
  public bool FeaturesWrite { get; set; }
  [FeatureKeyName("audiences-write")]
  public bool AudiencesWrite { get; set; }
  [FeatureKeyName("set-feature-availability")]
  public bool SetFeatureAvailability { get; set; }
  [FeatureKeyName("service-administration")]
  public bool ServiceAdministration { get; set; }
  [FeatureKeyName("webhooks-write")]
  public bool WebhooksWrite { get; set; }
  [FeatureKeyName("features-value-write")]
  public bool FeaturesValueWrite { get; set; }
  [FeatureKeyName("delete-organization")]
  public bool DeleteOrganization { get; set; }
  [FeatureKeyName("api-key-management")]
  public bool ApiKeyManagement { get; set; }
  [FeatureKeyName("webhooks")]
  public bool Webhooks { get; set; }
  [FeatureKeyName("cache-ttl")]
  public decimal CacheTtl { get; set; }
  [FeatureKeyName("live-updates-enabled")]
  public bool LiveUpdatesEnabled { get; set; }
  [FeatureKeyName("max-full-users")]
  public decimal MaxFullUsers { get; set; }
  [FeatureKeyName("max-limited-users")]
  public decimal MaxLimitedUsers { get; set; }
  [FeatureKeyName("max-projects")]
  public decimal MaxProjects { get; set; }
  [FeatureKeyName("webhook-type")]
  public WebhookType WebhookType { get; set; }
  [FeatureKeyName("organization-creation")]
  public bool OrganizationCreation { get; set; }
  [FeatureKeyName("environments-key-read")]
  public bool EnvironmentsKeyRead { get; set; }
}


// Options Enums

//Available webhook types 
public enum WebhookType
{
  [EnumMember(Value = "none")]
  None,
  [EnumMember(Value = "basic")]
  Basic,
  [EnumMember(Value = "advanced")]
  Advanced,
}

// Type Enums
public enum BooleanFeature
{
  OrganizationManagement,
  ProjectsWrite,
  EnvironmentsWrite,
  FeaturesWrite,
  AudiencesWrite,
  SetFeatureAvailability,
  ServiceAdministration,
  WebhooksWrite,
  FeaturesValueWrite,
  DeleteOrganization,
  ApiKeyManagement,
  Webhooks,
  LiveUpdatesEnabled,
  OrganizationCreation,
  EnvironmentsKeyRead,
}
public enum NumberFeature
{
  CacheTtl,
  MaxFullUsers,
  MaxLimitedUsers,
  MaxProjects,
}
public enum StringFeature
{
}

// Feature Gate attribute
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class FeatureFilterAttribute : FeatureFilterAttributeBase
{
  protected override string Feature { get; }
  protected override object DefaultValue { get; }
  protected override object? IsEqualTo { get; }
  private readonly Dictionary<string, string> _featureKeyLookup = new()
  {
    { "OrganizationManagement", "organization-management" },
    { "ProjectsWrite", "projects-write" },
    { "EnvironmentsWrite", "environments-write" },
    { "FeaturesWrite", "features-write" },
    { "AudiencesWrite", "audiences-write" },
    { "SetFeatureAvailability", "set-feature-availability" },
    { "ServiceAdministration", "service-administration" },
    { "WebhooksWrite", "webhooks-write" },
    { "FeaturesValueWrite", "features-value-write" },
    { "DeleteOrganization", "delete-organization" },
    { "ApiKeyManagement", "api-key-management" },
    { "Webhooks", "webhooks" },
    { "CacheTtl", "cache-ttl" },
    { "LiveUpdatesEnabled", "live-updates-enabled" },
    { "MaxFullUsers", "max-full-users" },
    { "MaxLimitedUsers", "max-limited-users" },
    { "MaxProjects", "max-projects" },
    { "OrganizationCreation", "organization-creation" },
    { "EnvironmentsKeyRead", "environments-key-read" },
  };

  public FeatureFilterAttribute(BooleanFeature feature, bool defaultValue)
  {
    Feature = _featureKeyLookup.GetValueOrDefault(feature.ToString()) ?? feature.ToString();
    DefaultValue = defaultValue;
  }

  public FeatureFilterAttribute(BooleanFeature feature, bool isEqualTo, bool defaultValue)
  {
    Feature = _featureKeyLookup.GetValueOrDefault(feature.ToString()) ?? feature.ToString();
    IsEqualTo = isEqualTo;
    DefaultValue = defaultValue;
  }

  public FeatureFilterAttribute(StringFeature feature, string isEqualTo, string defaultValue)
  {
    Feature = _featureKeyLookup.GetValueOrDefault(feature.ToString()) ?? feature.ToString();
    IsEqualTo = isEqualTo;
    DefaultValue = defaultValue;
  }

  public FeatureFilterAttribute(NumberFeature feature, decimal isEqualTo, decimal defaultValue)
  {
    Feature = _featureKeyLookup.GetValueOrDefault(feature.ToString()) ?? feature.ToString();
    IsEqualTo = isEqualTo;
    DefaultValue = defaultValue;
  }

  public FeatureFilterAttribute(WebhookType isEqualTo, WebhookType defaultValue)
  {
    Feature = "webhook-type";
    IsEqualTo = isEqualTo;
    DefaultValue = defaultValue;
  }

}