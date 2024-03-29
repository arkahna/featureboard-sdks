using FeatureBoard.DotnetSdk.Attributes;
using FeatureBoard.DotnetSdk.Models;
using System.Runtime.Serialization;

namespace FeatureBoardSdk.Examples.DotnetApi;

// Features
public class Features : IFeatures
{
  [FeatureKeyName("requires-attribution")]
  public bool RequiresAttribution { get; set; }
  [FeatureKeyName("allow-edits")]
  public bool AllowEdits { get; set; }
  [FeatureKeyName("number-custom-collections")]
  public decimal NumberCustomCollections { get; set; }
  [FeatureKeyName("team-management")]
  public bool TeamManagement { get; set; }
  [FeatureKeyName("custom-collections")]
  public CustomCollections CustomCollections { get; set; }
  [FeatureKeyName("view-subscribers")]
  public bool ViewSubscribers { get; set; }
}


// Options Enums

//Custom collections
public enum CustomCollections
{
  [EnumMember(Value = "Disabled")]
  Disabled,
  [EnumMember(Value = "Enabled")]
  Enabled,
  [EnumMember(Value = "Shared")]
  Shared,
}

// Type Enums
public enum BooleanFeature
{
  RequiresAttribution,
  AllowEdits,
  TeamManagement,
  ViewSubscribers,
}
public enum NumberFeature
{
  NumberCustomCollections,
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
    { "RequiresAttribution", "requires-attribution" },
    { "AllowEdits", "allow-edits" },
    { "NumberCustomCollections", "number-custom-collections" },
    { "TeamManagement", "team-management" },
    { "ViewSubscribers", "view-subscribers" },
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

  public FeatureFilterAttribute(CustomCollections isEqualTo, CustomCollections defaultValue)
  {
    Feature = "custom-collections";
    IsEqualTo = isEqualTo;
    DefaultValue = defaultValue;
  }

}
