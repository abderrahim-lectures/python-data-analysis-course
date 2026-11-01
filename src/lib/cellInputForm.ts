// The form a cell shows for its input() calls: one labelled field per call
// site, answered before the run and replayed through Pyodide's synchronous
// stdin callback (see pythonInputs.ts for why they are collected up front and
// pyodide.worker.ts for the replay).
//
// Extracted from runnable-cell.client.ts so the DOM wiring of the runner and
// the behaviour of the form fail (and are read) separately. Everything here is
// plain DOM: no engine, no worker, no i18n — the strings and the "run the
// cell" action come in through CellInputFormOptions.
import {inputCallSites} from './pythonInputs.ts';

export interface CellInputFormOptions {
  /** The output panel the form is inserted before (it sits below the code). */
  output: HTMLElement;
  /** Current source of the cell; re-read whenever the fields are rebuilt. */
  source: () => string;
  /** Localized hint shown above the fields. */
  hint: string;
  /** Localized label for a field whose call passes no literal prompt (1-based). */
  fallbackLabel: (position: number) => string;
  /** Runs the cell — Enter on the last field, like a terminal prompt. */
  run: () => void;
}

export interface CellInputForm {
  /** One field per input() call site in the current source, values preserved. */
  sync(): void;
  /** The values, in field order. */
  values(): string[];
  /** Add a field beyond the detected call sites (the run hit end-of-input). */
  grow(): void;
  /** Pyodide stdin callback over a snapshot of the values taken now. */
  stdin(): () => string | undefined;
}

interface Field {
  row: HTMLElement;
  prompt: HTMLElement;
  input: HTMLInputElement;
}

export function createCellInputForm(opts: CellInputFormOptions): CellInputForm {
  const box = document.createElement('div');
  box.className = 'cell__stdin';
  box.hidden = true;
  const hint = document.createElement('p');
  hint.className = 'cell__stdin-hint';
  hint.textContent = opts.hint;
  box.appendChild(hint);
  opts.output.parentElement?.insertBefore(box, opts.output);

  const fields: Field[] = [];
  // The source the fields were last built from. Rebuilding only on an actual
  // edit (not on every Run) is what lets a field added by grow() survive the
  // next Run while the code is unchanged.
  let builtFrom: string | null = null;

  const relabel = (): void => {
    fields.forEach((f, i) => {
      f.prompt.textContent = f.input.dataset.prompt || opts.fallbackLabel(i + 1);
    });
  };

  const append = (prompt: string): Field => {
    const row = document.createElement('label');
    row.className = 'cell__stdin-field';
    const promptEl = document.createElement('span');
    promptEl.className = 'cell__stdin-prompt';
    const input = document.createElement('input');
    input.className = 'cell__stdin-input';
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    // relabel() reads the prompt from here, so a field keeps its own label
    // when the ones before it change.
    input.dataset.prompt = prompt;
    row.appendChild(promptEl);
    row.appendChild(input);
    // Enter asks the next question, and runs the cell from the last field:
    // with several fields, running on the first one would execute a
    // half-filled cell.
    const index = fields.length;
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const next = fields[index + 1];
      if (next) {
        next.input.focus();
        next.input.select();
        return;
      }
      opts.run();
    });
    box.appendChild(row);
    const field = {row, prompt: promptEl, input};
    fields.push(field);
    return field;
  };

  return {
    sync() {
      const src = opts.source();
      if (src === builtFrom) return;
      builtFrom = src;
      const sites = inputCallSites(src);
      while (fields.length > sites.length) fields.pop()?.row.remove();
      sites.forEach((site, i) => {
        const field = fields[i] ?? append(site.prompt);
        field.input.dataset.prompt = site.prompt;
      });
      relabel();
      box.hidden = fields.length === 0;
    },

    values() {
      return fields.map((f) => f.input.value);
    },

    grow() {
      const field = append('');
      relabel();
      box.hidden = false;
      field.input.focus();
    },

    stdin() {
      const pending = fields.map((f) => f.input.value);
      return () => pending.shift();
    },
  };
}
