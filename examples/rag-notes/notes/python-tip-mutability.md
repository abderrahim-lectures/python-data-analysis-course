## Python tip: mutable default arguments

A classic Python pitfall: never use a mutable object, like a list or dict,
as a default argument value.

```python
def add_item(item, items=[]):  # BUG: the same list is reused across calls
    items.append(item)
    return items
```

Default argument values are evaluated once, when the function is defined,
not once per call. Every call that doesn't pass `items` explicitly shares
the exact same list object, so items silently pile up across unrelated
calls.

The fix is to default to `None` and create a fresh list inside the
function body:

```python
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```
