namespace FeatureBoard.DotnetSdk.Attributes;


[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
public class FeatureKeyNameAttribute : Attribute
{
  /// <summary>
  /// The name of the feature key.
  /// </summary>
  public string Name { get; }
  /// <summary>
  /// Initializes a new instance of <see cref="FeatureKeyNameAttribute"/> with the specified feature key name.
  /// </summary>
  /// <param name="name">The name of the property.</param>
  public FeatureKeyNameAttribute(string name)
  {
    Name = name;
  }
}
