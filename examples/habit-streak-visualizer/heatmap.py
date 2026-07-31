"""Render a habit's grid (see grid.py) as a GitHub-contributions-style
matplotlib heatmap.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from matplotlib.colors import LinearSegmentedColormap, ListedColormap
from matplotlib.figure import Figure

# One-hue sequential ramp (light -> dark blue), matching this course's chart
# color convention: sequential magnitude data gets a single hue, light means
# "near zero," dark means "high," never a rainbow.
_SEQUENTIAL_BLUE = LinearSegmentedColormap.from_list(
    "habit_blue", ["#eaf2fc", "#9ec5f4", "#3987e5", "#0d366b"]
)
_NO_DATA_GRAY = "#e8e8ea"

WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def render_heatmap(grid: np.ndarray, dates: pd.DatetimeIndex, habit: str, title_suffix: str = ""):
    """Returns a matplotlib Figure with the grid drawn cell-by-cell, colored
    by intensity (0 = missed, faint blue -> deep blue = building streak),
    with unlogged/out-of-range cells drawn in flat gray rather than left
    blank (so "no data" reads differently from "0 intensity")."""
    n_rows, n_weeks = grid.shape

    fig = Figure(figsize=(max(6, n_weeks * 0.32), 2.4), dpi=150)
    ax = fig.add_subplot(111)

    display = np.where(np.isnan(grid), 0.0, grid)
    mask_no_data = np.isnan(grid)

    ax.imshow(display, cmap=_SEQUENTIAL_BLUE, vmin=0, vmax=1, aspect="equal")

    # Paint the "no data" cells gray on top, since imshow can't mix two
    # colormaps in one call.
    no_data_overlay = np.ma.masked_where(~mask_no_data, np.ones_like(grid))
    ax.imshow(no_data_overlay, cmap=ListedColormap([_NO_DATA_GRAY]), aspect="equal")

    ax.set_yticks(range(n_rows))
    ax.set_yticklabels(WEEKDAY_LABELS, fontsize=8)

    # Label the first week of each month along the x-axis, GitHub-style,
    # instead of one label per week (which would be unreadable).
    month_starts = []
    seen_months = set()
    for date in dates:
        key = (date.year, date.month)
        if key not in seen_months:
            seen_months.add(key)
            month_starts.append(date)

    anchor = dates[0] - pd.Timedelta(days=dates[0].weekday())
    tick_positions = [(d - anchor).days // 7 for d in month_starts]
    tick_labels = [d.strftime("%b") for d in month_starts]
    ax.set_xticks(tick_positions)
    ax.set_xticklabels(tick_labels, fontsize=8)

    ax.set_xticks(np.arange(-0.5, n_weeks, 1), minor=True)
    ax.set_yticks(np.arange(-0.5, n_rows, 1), minor=True)
    ax.grid(which="minor", color="white", linewidth=1.5)
    ax.tick_params(which="minor", length=0)
    for spine in ax.spines.values():
        spine.set_visible(False)

    ax.set_title(f"{habit} — check-in streaks{title_suffix}", fontsize=11, loc="left")
    fig.tight_layout()
    return fig
