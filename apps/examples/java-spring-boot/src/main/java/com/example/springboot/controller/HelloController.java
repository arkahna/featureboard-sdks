package com.example.springboot.controller;

import featureboard.java.sdk.FeatureBoardClientImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
public class HelloController {

  @Autowired
  private final FeatureBoardClientImpl featureBoardClient;

  public HelloController(FeatureBoardClientImpl featureBoardClient) {
    this.featureBoardClient = featureBoardClient;
  }

  @GetMapping("/string")
  public String stringGet() {
    return featureBoardClient.GetFeatureValue("string_toggle", "String Default Value!");
  }

  @GetMapping("/boolean")
  public String booleanGet() {
    if (featureBoardClient.GetFeatureValue("boolean_toggle", false)) {
      return "This is true!";
    }
    return "This is false!";
  }

  @GetMapping("/bigdecimal")
  public String bigdecimalGet() {
    return "BigDecimal Value : " + featureBoardClient.GetFeatureValue("bigdecimal_toggle", new BigDecimal(22)).toString();
  }

  @GetMapping("/tprop")
  public String tpropGet() {

    return "";
  }

}
