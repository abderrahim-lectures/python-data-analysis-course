## 3. A failing cell shows only the beginner hint — the exception the lesson teaches disappears

**Labels:** `type:bug`, `area:ui`, `area:python-101`
**Severity:** medium (content contradicts output)

### What a learner saw

04-type-conversion says, in the lesson text and in the code comment,

```
int("hello")    # ValueError: invalid literal for int()
age = input("Age? ")
print(age + 1)  # TypeError: can only concatenate str (not "int") to str
```

Pressing Run showed only *"Can't convert that to a number. Make sure it's digits only."* and
*"You're trying to add text and a number…"* — the `ValueError` / `TypeError` the lesson is
teaching never appeared anywhere on the page.

### Root cause

`runCellCode`'s catch block did `rt.appendLine('err', friendlyError(raw))`, and `friendlyError`
*returns the hint instead of* the raw message when a mapping matches. The mapped hint replaced
the exception text.

### Fix (PR #321)

The raw exception is printed first and the hint after it, so the panel shows
`ValueError: invalid literal for int() with base 10: 'hello'` followed by the beginner
sentence. Verified in the browser on cells 4 and 7 of the lesson.
