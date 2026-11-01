# Vendored Pyodide is missing `openblas`, so scipy is broken for every visitor

**Labels:** `type:bug`, `area:data-analysis`, `area:infra`
**Severity:** high (a whole library, and the lessons that use it)

## What a learner saw

In `/learn/data-analysis/hard/lessons/06-correlation-analysis/`, the cell that computes a
Spearman correlation fails with

```
ImportError: Could not load dynamic lib:
  /lib/python3.12/site-packages/scipy/linalg/_fblas.cpython-312-wasm32-emscripten.so
Error: bad export type for 'ztrsm_': undefined
```

`import scipy.stats` fails the same way, so anything that reaches scipy (`df.corr(method="spearman")`,
seaborn paths that import it, statsmodels) is broken.

## Root cause

Pyodide ships some dependencies as **shared libraries** — separate `.zip` entries in
`pyodide-lock.json` with `shared_library: true` — rather than wheels. `scipy` depends on
`openblas`, which is one of them (`openblas-0.3.26.zip`). `scripts/vendor-pyodide.mjs` only
copied files matching `.whl`:

```js
if (/\S+\.whl$/.test(p.file_name)) closure.add(p.file_name);   // .zip never matched
```

so the file was never downloaded. The dependency closure of the six vendored roots is 18 files;
exactly one was missing, and it is the one scipy's BLAS needs.

Confirmed on production: `https://pyda-course.online/pyodide/scipy-1.12.0-…whl` → 200,
`https://pyda-course.online/pyodide/openblas-0.3.26.zip` → **404**.

## Fix

`scripts/vendor-pyodide.mjs` now accepts `.zip` as well (`/\.(?:whl|zip)$/`). Re-running it
downloads `openblas-0.3.26.zip` (6.1 MB, manifest `totalBytes` 138,716,900 → 144,834,556).

Verified in the browser against the real engine: `import scipy.stats` → `scipy 1.12.0`,
`df["a"].corr(df["b"], method="spearman")` → `1.0`, and **all ten** cells of the
correlation-analysis lesson now run with no errors (Spearman 0.2313 on the real dataset).

## Note

The same closure logic covers the other shared libraries (`libhdf5`, `lzma`, `openssl`); none of
them is in the current root set, but a future `import h5py` would hit the identical wall.
