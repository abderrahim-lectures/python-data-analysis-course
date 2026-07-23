## pandas groupby, briefly

`groupby` splits a DataFrame into groups based on the values in one or more
columns, then lets you compute a summary statistic separately for each
group, then (usually) combines the results back into a single DataFrame or
Series. This three-step shape is often called split-apply-combine.

```python
import pandas as pd

df = pd.DataFrame({
    "city": ["Rabat", "Rabat", "Fes", "Fes"],
    "sales": [100, 150, 80, 90],
})

df.groupby("city")["sales"].mean()
```

This returns the average sales per city, one row per unique value in the
`city` column. The same pattern works with `.sum()`, `.count()`, `.max()`,
or a custom function passed to `.agg()`.
