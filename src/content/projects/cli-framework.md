---
title: "CLI Framework Builder"
description: "Build a composable CLI framework with subcommands, auto-generated help, and plugin support."
difficulty: "advanced"
estimatedMinutes: 110
tags: ["click", "typer", "cli", "argparse", "plugins"]
learningObjectives:
  - Parse command-line arguments with `argparse` and `sys.argv`
  - Build subcommand routing with automatic help generation
  - Load configuration from YAML/JSON files and environment variables
  - Design a plugin architecture with dynamic module loading
prerequisites:
  - "Python basics and intermediate OOP"
  - "Understanding of modules, imports, and decorators"
  - "Familiarity with YAML or JSON config files"
---

## What You'll Learn

- Parse command-line arguments with subcommands and `--flag` options
- Auto-generate help text from docstrings and type hints
- Load configuration from YAML files and environment variables
- Design a plugin architecture that loads modules dynamically

## What You'll Build

A reusable CLI framework supporting subcommand routing (e.g., `mycli users create`), auto-generated help, YAML config loading, and a plugin system that discovers commands from separate modules.

## Where to Run It

- **Local with `uv`**: Required — CLI tools need a terminal
- **Google Colab**: Limited, but you can test core logic
- **JupyterLite**: Not suitable for CLI execution

## Setup

```bash
uv init cli-framework
cd cli-framework
uv add pyyaml
```

## Step 1: Build the Core Router

Create the base framework that discovers commands, parses arguments, and routes execution.

```python
import sys
import inspect
from typing import Callable, Any

class CLIFramework:
    """A composable CLI framework with subcommand routing."""

    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        self.commands: dict[str, dict[str, Any]] = {}

    def command(self, name: str | None = None, help_text: str | None = None):
        def decorator(func: Callable) -> Callable:
            cmd_name = name or func.__name__
            sig = inspect.signature(func)
            params = []
            for pname, param in sig.parameters.items():
                annotation = param.annotation if param.annotation != inspect.Parameter.empty else str
                default = param.default if param.default != inspect.Parameter.empty else None
                params.append({"name": pname, "type": annotation, "default": default, "required": default is None})
            self.commands[cmd_name] = {"func": func, "help": help_text or func.__doc__ or "", "params": params}
            return func
        return decorator

    def run(self, args: list[str] | None = None) -> None:
        args = args or sys.argv[1:]
        if not args or args[0] in ("-h", "--help"):
            self._print_help()
            return

        cmd_name = args[0]
        if cmd_name not in self.commands:
            print(f"Error: Unknown command '{cmd_name}'")
            sys.exit(1)

        cmd = self.commands[cmd_name]
        parsed = self._parse_args(cmd["params"], args[1:])
        result = cmd["func"](**parsed)
        if result is not None:
            print(result)

    def _parse_args(self, param_defs: list[dict], args: list[str]) -> dict:
        parsed = {}
        positional = [p for p in param_defs if p["default"] is None]
        for i, arg in enumerate(args):
            if arg.startswith("--"):
                key, _, value = arg[2:].partition("=")
                if not value and i + 1 < len(args) and not args[i + 1].startswith("--"):
                    value = args[i + 1]
                parsed[key] = value
            elif i < len(positional):
                parsed[positional[i]["name"]] = arg
        for p in param_defs:
            if p["name"] not in parsed and p["default"] is not None:
                parsed[p["name"]] = p["default"]
        return parsed

    def _print_help(self) -> None:
        print(f"\n{self.name} — {self.description}\n")
        print("Available commands:")
        for name, cmd in sorted(self.commands.items()):
            print(f"  {name:20s} {cmd['help'][:60]}")


cli = CLIFramework("taskmanager", "A simple task management CLI")

@cli.command(help_text="List all tasks")
def list(limit: int = 10):
    """List tasks with an optional limit."""
    tasks = ["Buy groceries", "Write docs", "Fix bug #42", "Deploy v2.0"]
    for i, task in enumerate(tasks[:limit], 1):
        print(f"  {i}. {task}")

@cli.command(help_text="Add a new task")
def add(title: str, priority: str = "medium"):
    """Add a task with a given priority."""
    print(f"  Added: '{title}' (priority: {priority})")

cli.run(["list", "--limit", "2"])
cli.run(["add", "Learn CLI frameworks", "--priority", "high"])
```

## Step 2: Add Configuration Loading

Build a config loader that reads YAML files and falls back to environment variables.

```python
import os
import yaml
from pathlib import Path

class ConfigLoader:
    def __init__(self, app_name: str):
        self.app_name = app_name
        self.config: dict = {}

    def load_yaml(self, path: str) -> dict:
        if not Path(path).exists():
            return {}
        with open(path) as f:
            data = yaml.safe_load(f) or {}
        env_prefix = f"{self.app_name.upper()}_"
        for key, value in os.environ.items():
            if key.startswith(env_prefix):
                data[key[len(env_prefix):].lower()] = value
        self.config = data
        return data

    def get(self, key: str, default: Any = None) -> Any:
        return self.config.get(key, default)


sample_config = 'app:\n  name: "My CLI Tool"\n  version: "1.0.0"\ndatabase:\n  host: "localhost"\n  port: 5432\nlogging:\n  level: "INFO"\n'
with open("config.yaml", "w") as f:
    f.write(sample_config)

config = ConfigLoader("myapp")
config.load_yaml("config.yaml")
print(f"App: {config.get('app', {}).get('name')}, DB: {config.get('database', {}).get('host')}")
```

## Step 3: Build a Plugin System and Wire It Together

Create a plugin loader that discovers command modules from a directory, then combine everything into a working CLI.

```python
import importlib
from pathlib import Path

class PluginLoader:
    def __init__(self, cli: CLIFramework, plugin_dir: str = "plugins"):
        self.cli = cli
        self.plugin_dir = Path(plugin_dir)

    def load_all(self) -> int:
        if not self.plugin_dir.exists():
            self.plugin_dir.mkdir(parents=True)
            return 0
        count = 0
        for py_file in self.plugin_dir.glob("*.py"):
            if py_file.name.startswith("_"):
                continue
            try:
                module = importlib.import_module(f"plugins.{py_file.stem}")
                if hasattr(module, "register"):
                    module.register(self.cli)
                    count += 1
            except Exception as e:
                print(f"  Failed to load {py_file.stem}: {e}")
        return count

# Create a sample plugin: plugins/stats.py
plugin_dir = Path("plugins")
plugin_dir.mkdir(exist_ok=True)
with open(plugin_dir / "stats.py", "w") as f:
    f.write('import platform, os\n'
            'def register(cli):\n'
            '    @cli.command(name="stats:system", help_text="Show system information")\n'
            '    def system_info():\n'
            '        print(f"  Platform: {platform.platform()}")\n'
            '        print(f"  Python: {platform.python_version()}")\n')

# Wire everything together
config = ConfigLoader("taskmanager")
config.load_yaml("config.yaml")
plugin_count = PluginLoader(cli, "plugins").load_all()
print(f"\n  {cli.name} v{config.get('app', {}).get('version', '0.0.1')} — {len(cli.commands)} commands, {plugin_count} plugins\n")
cli.run()
```

## Challenges

<details>
<summary><strong>Challenge 1: Argument Type Coercion</strong></summary>

Update `_parse_args` to automatically convert arguments to their annotated types. For example, convert `int`-annotated params from string to integer, and raise a clear error on failure.

</details>

<details>
<summary><strong>Challenge 2: Command Groups</strong></summary>

Add support for nested command groups (e.g., `mycli db migrate`). Implement a `group()` decorator that creates a namespace for related commands.

</details>

<details>
<summary><strong>Challenge 3: Shell Completion</strong></summary>

Generate a bash completion script that tab-completes command names and their `--flag` options. Output the script to stdout so users can pipe it to their `.bashrc`.

</details>

## Stretch Goals

- [ ] Add shell completion for bash, zsh, and fish
- [ ] Implement a testing framework for CLI commands
- [ ] Build a decorator-based middleware system for command preprocessing

## What You Learned

- Parsed command-line arguments with subcommand routing and `--flag` options
- Auto-generated help text from docstrings and type hints
- Loaded configuration from YAML files with environment variable overrides
- Designed a plugin architecture that discovers and loads modules dynamically
- Built a composable, reusable CLI framework from scratch
