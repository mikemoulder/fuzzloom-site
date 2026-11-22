# Quick start

From nothing to a shrunk counterexample in five steps.

## 1. Install fe and Node

You need [fe 26.6](https://fe-lang.org/getting-started/installation/) and Node 22.18 or newer:

```bash
curl -fsSL https://raw.githubusercontent.com/argotorg/fe/master/feup/feup.sh | bash -s -- --version v26.6.0
node --version
```

`diff` and `--backend native` also need fe's native backend, which runs on Linux and macOS. On Windows, install fe inside WSL as well; Fuzzloom then runs native tests there by itself.

## 2. Check your setup

Run this from inside any Fe ingot (a directory with `fe.toml` and `src/`):

```bash
npx -y fuzzloom@0.1.3 doctor
```

```text
ok    Node              v22.18.0
ok    fe                fe 26.6.0 (5b3f96a) at /home/you/.fe/bin/fe
ok    Fe library        .../node_modules/fuzzloom/ingot
ok    Library compiles  fe check passed
ok    Native backend    fe 26.6.0 (5b3f96a) in this machine
warn  Project           ingot my_ingot: 0 prop_*, 0 diff_*, 0 seq_* functions, 0 skipped
```

The project warning goes away once you write your first property.

## 3. Write a property

Add a public function whose name starts with `prop_` and which returns `bool`, anywhere under `src/`:

```fe
pub fn fee(_ amount: u64) -> u64 {
    amount.wrapping_mul(30) / 10000
}

/// The fee matches exact arithmetic for every amount.
pub fn prop_fee_matches_exact_math(_ amount: u64) -> bool {
    let exact: u128 = (amount as u128) * 30 / 10000
    (fee(amount) as u128) == exact
}
```

## 4. Fuzz it

```bash
npx -y fuzzloom@0.1.3 fuzz --strict --seed 7
```

```text
FAIL  prop_fee_matches_exact_math(u64)  counterexample at input 2
      amount = 614891469123651721
      shrunk from 4762291152399575021 in 1414 evaluations
      reproduce: fuzzloom reproduce prop_fee_matches_exact_math-0e05b819
```

`614891469123651721` is `u64::MAX / 30 + 1`, the smallest amount for which `amount * 30` wraps. The shrinker found the exact threshold. The seed makes the run repeatable; leave it out and Fuzzloom picks one at random and prints it.

`--strict` exits 2 before running if Fuzzloom skips a selected target. Use `npx -y fuzzloom@0.1.3 list` to see each target and any skip reasons.

## 5. Fix it and replay

Widen before multiplying, then check the saved failure again:

```fe
pub fn fee(_ amount: u64) -> u64 {
    ((amount as u128) * 30 / 10000).downcast_truncate()
}
```

```bash
npx -y fuzzloom@0.1.3 replay
```

```text
FIXED  prop_fee_matches_exact_math-0e05b819  now passes
```

Commit `.fuzzloom/failures/`: it is your regression suite. Every later `fuzz` also mutates those saved inputs, to catch a fix that only handles the one input that was saved.

## Next

- [Writing properties](writing-properties.html): types, labels and what gets skipped.
- [Effects and fixtures](effects.html): properties that use state or context.
- [Stateful sequences](stateful.html) tests repeated operations on a shared fixture and replays the saved trace.
- [Differential testing](differential.html): compare sonatina and native.
- [Running in CI](ci.html): exit codes and JUnit reports.
