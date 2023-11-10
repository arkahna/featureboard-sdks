package com.example.springboot.controller;

import featureboard.java.sdk.interfaces.FeatureBoardClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@ConditionalOnProperty(name = "featureBoardOptions.updateStrategy", havingValue = "onrequest", matchIfMissing = false)
public class FeatureboardRestController {

  @Autowired
  private final FeatureBoardClient featureBoardClient;

  public FeatureboardRestController(FeatureBoardClient featureBoardClient) {
    this.featureBoardClient = featureBoardClient;
  }

  @GetMapping("/string")
  public String stringGet() {
    return featureBoardClient.getFeatureValue("string_toggle", "String Default Value!");
  }

  @GetMapping("/boolean")
  public String booleanGet() {
    if (featureBoardClient.getFeatureValue("boolean_toggle", false)) {
      return "This is true!";
    }
    return "This is false!";
  }

  @GetMapping("/bigdecimal")
  public String bigdecimalGet() {
    return "BigDecimal Value : " + featureBoardClient.getFeatureValue("bigdecimal_toggle", new BigDecimal(22)).toString();
  }

  @GetMapping("/tprop")
  public String tpropGet() {

    return "";
  }

}
