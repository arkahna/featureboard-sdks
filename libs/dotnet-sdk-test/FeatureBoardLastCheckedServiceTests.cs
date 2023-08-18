using System;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Bogus;
using Moq;
using FeatureBoard.DotnetSdk.Models;

namespace FeatureBoard.DotnetSdk.Test
{
  public class FeatureBoardLastCheckedServiceTests
  {
    private static readonly Faker _faker = new Faker();
    private static readonly DateTimeOffset _testDate = _faker.Date.RecentOffset();
    private static readonly TimeSpan _testMaxAge = _faker.Date.Timespan();
    private static readonly NullLogger<FeatureBoardLastCheckedService> _testLogger = new();

    private DateTimeOffset _testLastChecked;

    private readonly IOptions<FeatureBoardOptions> _fakeOptions = Options.Create<Models.FeatureBoardOptions>(new Models.FeatureBoardOptions() { MaxAge = _testMaxAge });
    private readonly Mock<FeatureBoardService> _featureBoardServiceMock = new(null, null);

    private FeatureBoardLastCheckedService BuildTestSubject()
    {
      return new FeatureBoardLastCheckedService(_featureBoardServiceMock.Object, _fakeOptions, () => _testDate, () => ref _testLastChecked, _testLogger);
    }

    [Fact]
    public async Task ItCallsRefreshFeatureConfigurationIfCalledAfterMaxAgeExpiredAndDoesNotUpdateLastChecked()
    {
      // Arrange
      _featureBoardServiceMock.Setup(svc => svc.RefreshFeatureConfiguration(It.IsAny<CancellationToken>())).ReturnsAsync(default(bool?));
      var testSubject = BuildTestSubject();
      _testLastChecked = _testDate - 2 * _testMaxAge;

      // Act
      await testSubject.RefreshFeatureConfiguration(default);

      // Assert
      Assert.Equal(_testDate - 2 * _testMaxAge, _testLastChecked);
      _featureBoardServiceMock.Verify(svc => svc.RefreshFeatureConfiguration(default), Times.Once);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task ItCallsRefreshFeatureConfigurationIfCalledAfterMaxAgeExpiredAndUpdatesLastChecked(bool refreshStatus)
    {
      // Arrange
      _featureBoardServiceMock.Setup(svc => svc.RefreshFeatureConfiguration(It.IsAny<CancellationToken>())).ReturnsAsync(refreshStatus);
      var testSubject = BuildTestSubject();
      _testLastChecked = _testDate - 2 * _testMaxAge;

      // Act
      await testSubject.RefreshFeatureConfiguration(default);

      // Assert
      Assert.Equal(_testDate, _testLastChecked);
      _featureBoardServiceMock.Verify(svc => svc.RefreshFeatureConfiguration(default), Times.Once);
    }


    [Fact]
    public async Task ItDoesNotCallRefreshFeatureConfigurationIfWithinMaxAgeTimeSpan()
    {
      // Arrange
      var testSubject = BuildTestSubject();
      _testLastChecked = _testDate - _testMaxAge;

      // Act
      await testSubject.RefreshFeatureConfiguration(default);

      // Assert
      Assert.Equal(_testDate - _testMaxAge, _testLastChecked);
      _featureBoardServiceMock.Verify(svc => svc.RefreshFeatureConfiguration(It.IsAny<CancellationToken>()), Times.Never);
    }
  }
}
