package com.example.springboot;

import featureboard.java.sdk.interfaces.AudienceProvider;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class AudienceProviderImpl implements AudienceProvider {

  @Override
  public List<String> getAudienceKeys() {
    List<String> validKeys = new ArrayList<>();
    validKeys.add("demoAudience");
    return validKeys;
  }
}
