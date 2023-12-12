# How to use Verdaccio to test locally

## Start Verdaccio

```bash
nx local-registry
```

## Publish your package

```bash
cd libs/js-sdk (or whatever pacakge)
pnpm publish --registry http://localhost:4873/ --no-git-checks
```

## Install the package

Now in your own project

```bash
pnpm add @featureboard/js-sdk --registry http://localhost:4873/
```
