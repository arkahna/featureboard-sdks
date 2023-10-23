package com.example.springboot;

import featureboard.java.sdk.interfaces.AudienceProvider;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AudienceProviderImpl implements AudienceProvider {

  @Override
  public List<String> getAudienceKeys() {
    // TODO: implement me
    return null;
  }
}
