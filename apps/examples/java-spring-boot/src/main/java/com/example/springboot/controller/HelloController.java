package com.example.springboot.controller;

import featureboard.java.sdk.FeatureBoardClientImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

  @Autowired
  private final FeatureBoardClientImpl featureBoardClient;

  public HelloController(FeatureBoardClientImpl featureBoardClient) {
    this.featureBoardClient = featureBoardClient;
  }

  @GetMapping("/")
  public String index() {

      return featureBoardClient.GetFeatureValue("some-feature", "Greetings from Spring Boot!");
  }

  //TODO: demo the thing

}
