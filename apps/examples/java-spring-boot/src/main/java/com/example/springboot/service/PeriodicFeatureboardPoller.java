package com.example.springboot.service;


import featureboard.java.sdk.FeatureBoardClientImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@EnableScheduling
@ConditionalOnProperty(name = "featureBoardOptions.updateStrategy", havingValue = "polling", matchIfMissing = false)
public class PeriodicFeatureboardPoller {

  @Autowired
  private final FeatureBoardClientImpl featureBoardClient;
  private static final Logger logger = LoggerFactory.getLogger(PeriodicFeatureboardPoller.class);

  public PeriodicFeatureboardPoller(FeatureBoardClientImpl featureBoardClient) {
    this.featureBoardClient = featureBoardClient;
  }

  /**
   * Check feature status periodically and output the status. Designed to be used in polling mode.
   * Pretend this is not a web app (e.g. console based application).
   */
  @Scheduled(fixedDelayString = "30000")
  public void checkFeatureboardValues() {
    logger.info("Checking for Featureboard Values.");

    var stringValue = featureBoardClient.GetFeatureValue("string_toggle", "String Default Value!");

    String booleanValue = "";
    if (featureBoardClient.GetFeatureValue("boolean_toggle", false)) {
      booleanValue = "Boolean Value is true!";
    } else {
      booleanValue = "Boolean Value is false!";
    }

    var bigDecimalValue = "BigDecimal Value: " + featureBoardClient.GetFeatureValue("bigdecimal_toggle", new BigDecimal(22)).toString();

    logger.info("String Value: {}", stringValue);
    logger.info(booleanValue);
    logger.info(bigDecimalValue);
  }
}
