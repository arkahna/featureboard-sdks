using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace FeatureBoard.DotnetSdk.Test
{
  public class FeatureBoardServiceTests
  {
    private const int FakeClientRequestDelay = 1;

    private readonly Mock<IFeatureBoardHttpClient> _mockClient;
    private readonly FeatureBoardService _testSubject;

    public FeatureBoardServiceTests()
    {
      _mockClient = new Mock<IFeatureBoardHttpClient>();
      _mockClient.Setup(client => client.RefreshFeatureConfiguration(It.IsAny<CancellationToken>()))
        .ReturnsAsync(true, TimeSpan.FromSeconds(FakeClientRequestDelay));

      _testSubject = new FeatureBoardService(_mockClient.Object, new NullLogger<FeatureBoardService>());

    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task ItCallsRefreshFeatureConfiguration(bool refreshFeatureConfigurationResult)
    {
      // Arrange
      _mockClient.Setup(client => client.RefreshFeatureConfiguration(It.IsAny<CancellationToken>()))
        .ReturnsAsync(refreshFeatureConfigurationResult);

      // Act
      var actual = await _testSubject.RefreshFeatureConfiguration(CancellationToken.None);

      // Assert
      Assert.Equal(refreshFeatureConfigurationResult, actual);
    }

    [Fact]
    public async Task ItIgnoresRefreshFeatureConfigurationRequestWhilstAnotherIsInProgress()
    {
      // Arrange

      // Act
      var initialResultTask = _testSubject.RefreshFeatureConfiguration(CancellationToken.None);
      var subsequentResultTask = _testSubject.RefreshFeatureConfiguration(CancellationToken.None);
      var anotherSubsequentResultTask = _testSubject.RefreshFeatureConfiguration(CancellationToken.None);
      var afterDelayResultTask = await Task.Delay(TimeSpan.FromSeconds(0.1 + FakeClientRequestDelay)).ContinueWith(_ => _testSubject.RefreshFeatureConfiguration(CancellationToken.None));

      // Assert
      Assert.True(await initialResultTask);
      Assert.Null(await subsequentResultTask);
      Assert.Null(await anotherSubsequentResultTask);
      Assert.True(await afterDelayResultTask);
    }
  }
}
