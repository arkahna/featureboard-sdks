using System.Text.RegularExpressions;

namespace FeatureBoard.DotnetSdk.Helpers;

public static class FeatureBoardHelpers
{
  public static string ToFeatureBoardKey(this string propertyName)
    => Regex.Replace(propertyName, "(\\G(?!^)|\\b[a-zA-Z][a-z]*)([A-Z][a-z]*|\\d+)", "$1-$2", RegexOptions.Compiled)
      .ToLower(); //Pascal to Kebab case
}
