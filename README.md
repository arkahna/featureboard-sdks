# FeatureBoard SDKs

Contains various FeatureBoard SDKs for different languages.

- [.NET SDK](libs/dotnet-sdk/README.md)
- [JavaScript SDK](libs/js-sdk/README.md)
- [NodeJS SDK](libs/node-sdk/README.md)
- [React SDK](libs/react-sdk/README.md)

FeatureBoard Code Generators:

- [CLI](apps/cli/README.md)
- [NX plugin](libs/nx-plugin/README.md)

## What is FeatureBoard?

FeatureBoard is the future of Feature Management and is tailored for SaaS teams on the hunt for a simplified yet highly potent feature toggling solution. FeatureBoard enhances team productivity by allowing everyone to manage software features seamlessly, not just developers.

Go to [our website](https://featureboard.app) to find out more.

## Documentation

Installation and usage instructions can be found on our [docs site](https://docs.featureboard.app).

## Open Telemetry

The FeatureBoard SDKs are instrumented with Open Telemetry natively, so you can easily integrate with your existing observability tools.

### Unit tests

To configure the SDK to use a local Open Telemetry Collector, set the following environment variables:

OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

You can put this in a `.env` file in the root of the project.
