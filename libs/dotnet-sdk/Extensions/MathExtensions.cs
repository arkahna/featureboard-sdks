using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FeatureBoard.DotnetSdk.Extensions
{
  internal static class Math
  {
    public static T Max<T>(T first, T second) => Comparer<T>.Default.Compare(first, second) > 0 ? first : second;

    public static T Min<T>(T first, T second) => Comparer<T>.Default.Compare(first, second) < 0 ? first : second;
  }
}
