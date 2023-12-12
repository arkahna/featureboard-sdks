# Contributing to FeatureBoard's SDK

## Local development

### Prerequisites

- [NodeJS](https://nodejs.org/en/) (LTS)

### CLI

To run the CLI locally run the following command (with the arguments you want to pass)

```bash
pnpm cli
```

`pnpm cli login` will login to the dev app registration by default. If you want to login to production FeatureBoard

### Testing

If you would like to test packages locally, you can run a local verdaccio registry.

This can host the packages locally and allow you to test them in a target project.

See [Use Verdaccio](docs/use-verdaccio.md) for more details.
