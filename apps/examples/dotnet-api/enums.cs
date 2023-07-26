using FeatureBoard.DotnetSdk.Attributes;
using FeatureBoard.DotnetSdk.Models;
using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace FeatureBoardSdks.Examples.DotnetApi;

// Features
public class Features : IFeatures
{
  [JsonPropertyName("api-key-management")]
  public bool ApiKeyManagement { get; set; }
  [JsonPropertyName("audiences-write")]
  public bool AudiencesWrite { get; set; }
  [JsonPropertyName("cache-ttl")]
  public decimal CacheTtl { get; set; }
  [JsonPropertyName("delete-organization")]
  public bool DeleteOrganization { get; set; }
  [JsonPropertyName("environments-write")]
  public bool EnvironmentsWrite { get; set; }
  [JsonPropertyName("features-value-write")]
  public bool FeaturesValueWrite { get; set; }
  [JsonPropertyName("features-write")]
  public bool FeaturesWrite { get; set; }
  [JsonPropertyName("live-updates-enabled")]
  public bool LiveUpdatesEnabled { get; set; }
  [JsonPropertyName("max-full-users")]
  public decimal MaxFullUsers { get; set; }
  [JsonPropertyName("max-limited-users")]
  public decimal MaxLimitedUsers { get; set; }
  [JsonPropertyName("max-projects")]
  public decimal MaxProjects { get; set; }
  [JsonPropertyName("organization-management")]
  public bool OrganizationManagement { get; set; }
  [JsonPropertyName("projects-write")]
  public bool ProjectsWrite { get; set; }
  [JsonPropertyName("service-administration")]
  public bool ServiceAdministration { get; set; }
  [JsonPropertyName("set-feature-availability")]
  public bool SetFeatureAvailability { get; set; }
  [JsonPropertyName("webhook-type")]
  public WebhookType WebhookType { get; set; }
  [JsonPropertyName("webhooks")]
  public bool Webhooks { get; set; }
  [JsonPropertyName("webhooks-write")]
  public bool WebhooksWrite { get; set; }
}

// Type Enums
public enum BooleanFeature
{
  ApiKeyManagement,
  AudiencesWrite,
  DeleteOrganization,
  EnvironmentsWrite,
  FeaturesValueWrite,
  FeaturesWrite,
  LiveUpdatesEnabled,
  OrganizationManagement,
  ProjectsWrite,
  ServiceAdministration,
  SetFeatureAvailability,
  Webhooks,
  WebhooksWrite,
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

// Feature Gate attribute
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class FeatureGateAttribute : FeatureGateAttributeBase
{
  protected override string Feature { get; }
  protected override bool DefaultValue { get; }
  private readonly Dictionary<string, string> _featureKeyLookup = new()
  {
    { "ApiKeyManagement", "api-key-management" },
    { "AudiencesWrite", "audiences-write" },
    { "CacheTtl", "cache-ttl" },
    { "DeleteOrganization", "delete-organization" },
    { "EnvironmentsWrite", "environments-write" },
    { "FeaturesValueWrite", "features-value-write" },
    { "FeaturesWrite", "features-write" },
    { "LiveUpdatesEnabled", "live-updates-enabled" },
    { "MaxFullUsers", "max-full-users" },
    { "MaxLimitedUsers", "max-limited-users" },
    { "MaxProjects", "max-projects" },
    { "OrganizationManagement", "organization-management" },
    { "ProjectsWrite", "projects-write" },
    { "ServiceAdministration", "service-administration" },
    { "SetFeatureAvailability", "set-feature-availability" },
    { "WebhookType", "webhook-type" },
    { "Webhooks", "webhooks" },
    { "WebhooksWrite", "webhooks-write" },
  };

  public FeatureGateAttribute(BooleanFeature feature, bool defaultValue)
  {
    Feature = _featureKeyLookup.GetValueOrDefault(feature.ToString()) ?? feature.ToString();
    DefaultValue = defaultValue;
  }
}
