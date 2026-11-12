# Polaris Remotion authoring workspace

Created with `npx create-video@latest` on 29 September 2026, using the Blank template and Remotion 4.0.529. Run this folder's commands from `C:\FlameScope\docs\video\remotion`.

This is a separate video-authoring workspace under ADR-015. Its dependencies belong to this folder; the FlameScope application's root manifest remains dependency-free. The original presentation and completed Canvas concept film are in the parent folder. The starter composition is blank; the 240-second film has not been migrated into Remotion by this setup command.

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

To use the port selected for this project during setup:

```console
npm run dev -- --port=4175 --no-open
```

Then open [Remotion Studio](http://127.0.0.1:4175). Setup verification passed: `npm run lint` (ESLint and TypeScript), `npm run build`, 114/114 application tests, 20/20 offline evaluation, and an offline application load. Generated `build/` output and `node_modules/` are ignored by Git.

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
