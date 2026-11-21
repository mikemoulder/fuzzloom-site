# CLI reference

```text
fuzzloom <command> [path] [options]
```

`path` is the Fe ingot to work on, a directory with `fe.toml` and `src/`. It defaults to the current directory.

## Commands

| Command | What it does |
|---|---|
| `fuzzloom doctor [path]` | Checks Node, fe and its version, that the bundled Fe library compiles with your fe, the native backend, and the project's targets. Exits 2 if a required piece is missing |
| `fuzzloom list [path]` | Lists every target with its signature, effects, fixtures and declared ranges, and every skipped function with the reason |
| `fuzzloom fuzz [path]` | Runs every property campaign, plus one mutation campaign per saved failure, then recovers and shrinks any abort |
| `fuzzloom diff [path]` | Compares keyed checkpoints on sonatina and native and verifies the located mismatch |
| `fuzzloom reproduce <id> [path]` | Replays one saved failure from its stored input, with no random generation |
| `fuzzloom replay [path]` | Replays every saved failure: `FIXED` when it now passes, `FAILS` when it still fails, `REGRESSED` when a fixed one is back |

## Options

| Option | Meaning |
|---|---|
| `--seed <n>` | Base seed. The CLI prints the seed so the input stream can be repeated |
| `--digest-key <n>` | Reuse the recorded checkpoint key for `diff`. The default is sampled independently of the campaign seed |
| `--runs <n>` | Inputs per property (default 10,000) or per differential target (default 100,000) |
| `--backend <b>` | `sonatina` (EVM, the default) or `native` |
| `--only <text>` | Only targets, or for `replay` saved failures, whose name contains the text |
| `--no-corpus` | `fuzz` without the mutation campaigns around saved failures |
| `--json` | Machine-readable output |
| `--junit <file>` | Also write a JUnit XML report: findings are `<failure>`, infrastructure problems are `<error>` |
| `-h`, `--help` | The usage text |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Everything passed |
| `1` | A property failed or aborted, or the backends diverged |
| `2` | An infrastructure error: a compile error, out of gas, a timeout, a missing backend or unreadable output. Never a finding |

## Result lines

| Line | Command | Meaning |
|---|---|---|
| `PASS` | `fuzz` | No input failed; the next line says what the campaign exercised |
| `FAIL` | `fuzz` | The property returned `false`; the shrunk and original inputs follow |
| `ABORT` | `fuzz` | The property panicked or reverted; the recovered and shrunk input follows |
| `AGREE` | `diff` | Identical digests on both backends |
| `DIVERGE` | `diff` | The first differing input, with both outputs |
| `INFRA` | any | Something outside your code went wrong; see [Troubleshooting](troubleshooting.html) |

## Files

| Path | What it holds |
|---|---|
| `.fuzzloom/failures/<target>-<hash>.json` | One saved failure: the shrunk and original inputs, seed, iteration, backend and fe version. Commit these |
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
