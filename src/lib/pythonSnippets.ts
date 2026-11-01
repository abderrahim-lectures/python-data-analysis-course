// The Python source the runner injects into the engine: three snippets that
// shape how a cell runs (notebook-style trailing expression, matplotlib on the
// Agg backend, figure drain) and the input() shim that keeps the prompt on its
// own line. They live here rather than inline in pythonRunnerCore.ts so the
// TypeScript around them stays readable — nothing in this file is TypeScript.

// Pyodide runs each cell as a script, so a bare expression (`` 2 ** 10 ``,
// `` df.head() ``) silently produces nothing — while the identical cell in a
// Jupyter/Colab notebook echoes its value. Restore that REPL behavior: the
// cell's last top-level expression is wrapped in print(repr(...)), mirroring
// how a notebook displays a cell's trailing value. Detection is done with
// Python's own ast so assignments, control flow, def/class, and
// already-printing cells are never touched.
export const WRAP_EXPR_SRC = `
import ast

def _wrap_bare_expr(src):
    try:
        tree = ast.parse(src)
    except SyntaxError:
        return src
    if not tree.body:
        return src
    node = tree.body[-1]
    if not isinstance(node, ast.Expr):
        return src
    value = node.value
    if (
        isinstance(value, ast.Call)
        and (
            (isinstance(value.func, ast.Name) and value.func.id in ('print', 'display'))
            or (isinstance(value.func, ast.Attribute) and value.func.attr in ('show', 'display'))
        )
    ):
        return src
    # Mirror how a Jupyter/Colab cell echoes its last expression: rerun the
    # cell but replace that trailing expression with print(repr(<expr>)).
    # repr() gives 'hello' with quotes and escapes for strings, plain text for
    # numbers and collections. Precise AST offsets keep same-line statements
    # ('x = 1; 2 + 3'), multi-line expressions, and trailing comments intact
    # (the comment lands on the line after the closing paren).
    # ast's col_offset is a UTF-8 *byte* offset while len() and str slicing
    # count characters, so splicing by characters moved the insert point right
    # by one for every non-ASCII byte earlier on the line: 'print("café"); 2 + 2'
    # became '2print(...)' (SyntaxError) and 'nom = "José"; nom' became
    # 'nprint(...)' (NameError). Splice in bytes, where every offset ast reports
    # is already valid.
    lines = src.splitlines(keepends=True)
    raw = src.encode()
    start_off = len(''.join(lines[: node.lineno - 1]).encode()) + node.col_offset
    expr = (ast.get_source_segment(src, node) or '').encode()
    out = raw[:start_off] + b'print(repr(\\n' + expr + b'\\n))' + raw[start_off + len(expr):]
    return out.decode()
`;

// Pyodide ships matplotlib with a canvas backend (matplotlib-pyodide) that, on
// a real browser, renders `plt.show()` by appending a canvas to the bottom of
// the document — then closes the figure. That places the plot at the page
// bottom instead of in the cell, and closes figures before we can read them.
// Before each run we force matplotlib onto the compiled Agg backend: plt.show()
// becomes a no-op, no canvas reaches the page body, and every figure stays in
// the Gcf manager where the post-run drain collects it as an inline PNG.
export const FIG_SHOW_PATCH_SRC = `
import sys as _sys
try:
    import matplotlib as _mpl
    try:
        _mpl.use('Agg')
    except Exception:
        pass
    # A previous cell may have died mid-figure (a NameError after
    # plt.subplots() leaves the figure in the Gcf manager; the failed run's
    # drain never runs). Detach those orphaned figures so THIS cell's drain
    # renders only the figures this cell actually created.
    _plt = _sys.modules.get('matplotlib.pyplot')
    if _plt is not None:
        import matplotlib._pylab_helpers as _gcf
        for _num in list(_plt.get_fignums()):
            _gcf.Gcf.figs.pop(_num, None)
except Exception:
    pass
`;

// After a cell run, collect every matplotlib figure the cell left open (Agg's
// plt.show() is a no-op, so figures stay managed) as base64 PNGs for JS to
// render inline. The figures are detached from the Gcf manager here so a
// re-run doesn't accumulate stale figures. Returns a JSON string (a PyProxy
// list does not survive the runPythonAsync boundary as a JS array).
export const FIG_DRAIN_SRC = `
import sys as _sys
import io as _io
import base64 as _b64
def _drain_figs():
    _out = []
    _plt = _sys.modules.get('matplotlib.pyplot')
    if _plt is None:
        return '[]'
    import matplotlib._pylab_helpers as _gcf
    for _num in list(_plt.get_fignums()):
        _fig = _plt.figure(_num)
        _buf = _io.BytesIO()
        _fig.savefig(_buf, format='png', dpi=110, bbox_inches='tight')
        _out.append(_b64.b64encode(_buf.getvalue()).decode('ascii'))
        _gcf.Gcf.figs.pop(_num, None)
    import json as _dj
    return _dj.dumps(_out)
_drain_figs()
`;

// Pyodide's batched stdout only hands JS a complete line: a flushed partial
// line sits in the Python buffer until a newline arrives (verified in a real
// browser — `print("PARTIAL", end="", flush=True); print("AFTER")` renders as
// one "PARTIALAFTER" line). `input("Birth year? ")` writes its prompt without
// a newline, so the prompt reached the output panel *after* the value the
// learner had just typed — the answer appeared above its question.
// Wrapping `input` so it writes the prompt as a whole line fixes the order
// without touching the cell's own code: prompt line, then the echoed value,
// then whatever the cell prints.
export const INPUT_SHIM_SRC = `
import builtins as _pyda_builtins

if getattr(_pyda_builtins.input, '__name__', '') != '_pyda_input':
    _pyda_real_input = _pyda_builtins.input

    def _pyda_input(prompt='', /):
        text = '' if prompt is None else str(prompt)
        if text:
            print(text)  # newline-terminated, so the batched stream delivers it now
        return _pyda_real_input('')

    _pyda_builtins.input = _pyda_input
`;
