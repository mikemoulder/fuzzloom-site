# CLI reference

```text
fuzzloom <command> [path] [options]
```

`path` is the Fe ingot to work on, a directory with `fe.toml` and `src/`. It defaults to the current directory.

The examples use [Fuzzloom 0.1.3](https://www.npmjs.com/package/fuzzloom/v/0.1.3). Run installed commands as `npx -y fuzzloom@0.1.3 <command>` when you want a pinned version.

## Commands

| Command | What it does |
|---|---|
| `fuzzloom doctor [path]` | Checks Node, fe and its version, that the bundled Fe library compiles with your fe, the native backend, and the project's targets. Exits 2 if a required piece is missing |
| `fuzzloom list [path]` | Lists every target with its signature, effects, fixtures and declared ranges, and every skipped function with the reason |
| `fuzzloom fuzz [path]` | Runs every property campaign, plus one mutation campaign per saved failure, then recovers and shrinks any abort |
| `fuzzloom diff [path]` | Compares keyed checkpoints on sonatina and native and verifies the located mismatch |
| `fuzzloom sequence [path]` | Generates and shrinks traces of `seq_*` actions on one backend and saves a failing trace for replay |
| `fuzzloom reproduce <id> [path]` | Replays one saved input or ordered trace |
| `fuzzloom replay [path]` | Replays every saved failure: `FIXED` when it now passes, `FAILS` when it still fails, `REGRESSED` when a fixed one is back |

## Options

| Option | Meaning |
|---|---|
| `--seed <n>` | Base seed. The CLI prints the seed so the input stream can be repeated |
| `--digest-key <n>` | Reuse the recorded checkpoint key for `diff`. The default is sampled independently of the campaign seed |
| `--runs <n>` | Positive budget per target. Defaults to 10,000 property inputs, 100,000 differential input pairs, or 1,000 traces |
| `--steps <n>` | For `sequence`, limit each trace to 1–8 actions. The default is 8 |
| `--backend <b>` | `sonatina` (EVM, the default) or `native` |
| `--only <text>` | Select targets or saved failures whose name contains the text. Empty campaign selections exit 2 |
| `--strict` | For `fuzz`, `diff`, and `sequence`, exit 2 before running if a selected target was skipped |
| `--no-corpus` | `fuzz` without the mutation campaigns around saved failures |
| `--uniform` | For `fuzz`, sample within declared bounds with edge bias, argument correlation, and corpus mutation disabled |
| `--json` | Machine-readable output |
| `--junit <file>` | Also write a JUnit XML report: findings are `<failure>`, infrastructure problems are `<error>` |
| `-h`, `--help` | The usage text |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Everything passed |
| `1` | A property failed or aborted, or the backends diverged |
| `2` | An infrastructure or selection error, including an empty campaign, a selected skip under `--strict`, a compile error, a timeout, or out of gas |

## Result lines

| Line | Command | Meaning |
|---|---|---|
| `PASS` | `fuzz` | No input failed; the next line says what the campaign exercised |
| `FAIL` | `fuzz` | The property returned `false`; the shrunk and original inputs follow |
| `FAIL` | `sequence` | An invariant returned `false` after an action. The output includes the ordered shrunk trace |
| `ABORT` | `fuzz` | The property panicked or reverted; the recovered and shrunk input follows |
| `AGREE` | `diff` | Identical digests on both backends |
| `DIVERGE` | `diff` | The first differing input, with both outputs |
| `INFRA` | any | Something outside your code went wrong; see [Troubleshooting](troubleshooting.html) |

## Files

| Path | What it holds |
|---|---|
| `.fuzzloom/failures/<target>-<hash>.json` | One saved input or ordered trace, with seed, iteration, backend, and Fe version. Commit these records to replay them in CI |
| `.fuzzloom/tmp/` | Generated test harnesses. Removed when a command ends, kept only after an infrastructure error |

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `FE_BIN` | `~/.fe/bin/fe`, else `fe` on `PATH` | The fe binary |
| `FE_WSL_DISTRO` | the default distro | Windows: the WSL distro that runs native tests |
| `FE_WSL_BIN` | `~/.fe/bin/fe` | Windows: fe inside WSL |
| `FUZZLOOM_TIMEOUT_MS` | `600000` | Per `fe` invocation |
| `FUZZLOOM_INGOT` | the bundled copy | Use a different checkout of the Fe library |
| `NO_COLOR` | unset | Plain output |

See [Stateful sequences](stateful.html) for the receipt walkthrough and [Running in CI](ci.html) for strict selection and campaign counts.
