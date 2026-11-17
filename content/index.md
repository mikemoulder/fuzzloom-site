# Introduction

Fuzzloom is property-based testing and fuzzing for the [Fe](https://fe-lang.org) language, with differential testing between Fe's two backends.

You write a **property** as an ordinary Fe function that returns `bool`. Fuzzloom generates thousands of inputs for it inside Fe and shrinks every failure to a small counterexample. It saves each failure so you can replay it after the fix. It also runs the same logic on **sonatina (EVM)** and **native**, and pins the first input on which they disagree.

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
- **Backend comparison:** `diff` compares 100,000 inputs on sonatina and native and pins the first difference in 8 `fe` runs.
- **A regression suite:** every failure is a JSON record. `replay` re-checks them, and `fuzz` mutates them to find a fix that only handled one input.
- **CI output:** exit codes, `--json` and JUnit XML. Infrastructure problems (compile errors, out of gas) are never reported as findings.

## What it does not do

- **It does not prove a property.** A passing campaign means 10,000 well-chosen inputs found nothing, and the report says what they exercised.
- **No sequences of calls yet.** Each input gets fresh fixtures.
- **Limited input types.** Integers and `bool` only, 1 to 3 arguments per property.

## Where to go next

- [Quick start](quickstart.html): install and run your first property in a few minutes.
- [Writing properties](writing-properties.html): the conventions and what can be an argument.
- [How it works](architecture.html) and [Algorithms and guarantees](algorithms.html), for the full picture.
