# Introduction

Fuzzloom is property-based testing and fuzzing for the [Fe](https://fe-lang.org) language, with differential testing between Fe's two backends.

Write a **property** as a Fe function that returns `bool`. Fuzzloom generates inputs inside Fe, shrinks failures, and saves counterexamples for replay. It can also test ordered action traces against shared state and compare the same Fe logic on **Sonatina (EVM)** and **native**.

```fe
/// A withdrawal is allowed only up to the balance.
pub fn prop_withdraw_never_overdraws(_ balance: u128, _ amount: u128) -> bool {
    !can_withdraw(balance, amount) || amount <= balance
}
```

```text
$ npx fuzzloom fuzz --seed 7
FAIL  prop_withdraw_never_overdraws(u128, u128)  counterexample at input 19
      balance = 0
      amount  = 1
      shrunk from 216194592332408381925550103855666662331, 216194592332408381925550103855666662332 in 906 evaluations
      reproduce: fuzzloom reproduce prop_withdraw_never_overdraws-2c81bbb3
```

## What you get

- **Generated inputs:** boundary-biased (one argument draw in four comes from the edges of its type), with correlated multi-argument draws that reach bugs like `amount == balance + 1`.
- **Small counterexamples:** an exact sweep of the 256 smallest values, greedy descent and joint moves. The guarantee is a stated local minimum.
- **Inputs recovered from panics:** Fe cannot catch an abort. Fuzzloom finds the aborting input by searching on the run count, then shrinks it by replay.
- **Effects:** a property can declare `uses (ledger: mut Ledger)`. Fuzzloom builds each effect from your `fixture_*()` function, fresh for every input.
- **Input ranges:** `/// fuzzloom: start in 1668464000..=1700000000` restricts one argument everywhere, shrinking included.
- **Backend comparison.** `diff` compares 100,000 inputs per target by default and verifies a located mismatch by running the exact input on both backends.
- **Stateful sequences.** `sequence` checks a `seq_*` invariant across actions that share one effect fixture. It shrinks failing traces and saves the ordered actions for replay.
- **Regression records.** `replay` checks saved failures against current code. `fuzz` also mutates saved property and abort inputs to exercise nearby cases.
- **CI output.** `--strict` catches skipped selected targets before a campaign starts. `--json` reports campaign counts and `--junit` writes test results.

## What it does not do

- **It does not prove a property.** A passing campaign means 10,000 well-chosen inputs found nothing, and the report says what they exercised.
- **Bounded traces.** Sequences have at most eight actions. A panic during a sequence is an infrastructure outcome.
- **Limited input types.** Integers and `bool` only, 1 to 3 arguments per property.

## Where to go next

- [Quick start](quickstart.html): install and run your first property in a few minutes.
- [Writing properties](writing-properties.html): the conventions and what can be an argument.
- [Stateful sequences](stateful.html) walks through a receipt regression on both backends.
- [Compiler experiments](experiments.html) includes the exact shift oracle and the external Fe Keccak integration.
- [How it works](architecture.html) and [Algorithms and guarantees](algorithms.html), for the full picture.
