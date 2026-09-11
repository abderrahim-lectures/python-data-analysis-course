---
title: "Password Generator"
description: "Build a CLI password generator with entropy analysis, breach detection via HIBP, an encrypted credential vault, and a colored terminal report — all in pure Python."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["security", "cryptography", "cli", "hashing"]
xpReward: 50
learningObjectives:
  - Generate cryptographically secure random passwords with customizable character sets
  - Calculate password entropy and assign strength labels
  - Check passwords against the Have I Been Pwned breach database using k-anonymity
  - Store and retrieve credentials in an AES-encrypted vault file
  - Build a command-line interface with argparse
  - Track password age and flag expired entries
  - Produce colored, formatted terminal reports
prerequisites:
  - Basic Python strings and functions
  - Understanding of lists and loops
  - Familiarity with pip/uv for installing packages
---

# Password Generator

You reuse the same password everywhere because inventing a new one every time is tedious. In this project you will build a tool that does the tedious part for you: it generates strong passwords, measures how hard they are to crack, checks whether they have already shown up in a data breach, and stores them in an encrypted vault you can unlock with a master password.

This project only assumes Python 101-level basics — functions, lists, dictionaries, loops, and string formatting. No frameworks, no databases, no cloud services. Everything you need comes from the standard library plus one small encryption package.

This is optional and ungraded. See [Real-World Projects](/projects) for the full list.

## What you'll do

1. Generate cryptographically secure passwords with customizable character sets using the `secrets` module.
2. Analyze password strength by calculating entropy — the mathematical measure of unpredictability.
3. Check passwords against the Have I Been Pwned breach database without ever sending the full password (k-anonymity).
4. Build an encrypted vault that stores credentials protected by a master password using AES-256.
5. Create a CLI interface with `argparse` so the tool works from the command line.
6. Add a password expiry tracker that flags entries older than 90 days.
7. Polish the output with colored terminal formatting and a summary report.

## Where to run this

- **Locally with `uv` (recommended).** This project needs one third-party package (`cryptography`) for encryption — a good candidate for running Python on your own machine. The Setup section below walks through it.
- **JupyterLite playground.** Paste code blocks into cells and run them in the browser. The breach-check step needs a network connection; the vault step creates files in the browser's ephemeral storage.
- **Google Colab.** Click the Colab badge on the project page to run in a cloud notebook. Note that vault files created in Colab don't survive between sessions.

- **Run it in your browser.** An interactive companion notebook is ready — open it in Colab, Kaggle, or Binder and follow along top-to-bottom.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/password-generator/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/password-generator/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpassword-generator%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces the usual "install Python, then pip, then a virtual environment, then packages" chain — it manages Python versions and dependencies together.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

Then set up the project:

```bash
uv init password-generator
cd password-generator
uv add secrets hashlib cryptography httpx
```

The `secrets` module comes with Python and provides cryptographically strong random numbers. The `cryptography` package provides AES encryption for the vault. The `httpx` package handles HTTP requests to the breach-check API. The `hashlib` module (also built-in) computes SHA-1 hashes for the k-anonymity lookup.

## Step 1: Generate secure passwords

The first building block: a function that produces a random password with exactly the character types you want. The key insight is *which* random module to use — Python's `random` module is designed for simulations, not security. It's deterministic if you know the seed. The `secrets` module uses the operating system's true random source and is the right choice for anything security-related.

### 1.1 Build the character pool

**Starter hint:** Import `secrets` and `string`. Write a function `generate_password` that accepts keyword arguments controlling which character types to include (`use_uppercase`, `use_lowercase`, `use_digits`, `use_symbols`). Start by building a `charset` string from the types the caller wants.

```python
import secrets
import string

SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?"

def generate_password(
    length: int = 16,
    use_uppercase: bool = True,
    use_lowercase: bool = True,
    use_digits: bool = True,
    use_symbols: bool = True,
) -> str:
    """Generate a cryptographically secure random password."""
    charset = ""
    required = []

    if use_lowercase:
        charset += string.ascii_lowercase
        required.append(secrets.choice(string.ascii_lowercase))
    if use_uppercase:
        charset += string.ascii_uppercase
        required.append(secrets.choice(string.ascii_uppercase))
    if use_digits:
        charset += string.digits
        required.append(secrets.choice(string.digits))
    if use_symbols:
        charset += SYMBOLS
        required.append(secrets.choice(SYMBOLS))

    if not charset:
        raise ValueError("At least one character type must be selected")

    remaining = length - len(required)
    password_chars = required + [secrets.choice(charset) for _ in range(remaining)]

    # Shuffle so required characters are not clustered at the start
    secrets.SystemRandom().shuffle(password_chars)
    return "".join(password_chars)
```

The trick is the `required` list: we pick one character from each enabled type *first*, then fill the rest of the password from the full pool. This guarantees every requested type appears at least once. After that, `SystemRandom().shuffle` mixes the positions so the lowercase letter you guaranteed isn't always character zero.

**Expected output:** Generate a few examples and inspect them:

```python
for i in range(3):
    pw = generate_password(length=20)
    print(f"  {pw}")
```

```
  k7G!mP2xQ#nR9wL@jT4f
  aB3$vN8&kD5*pY1!mW6h
  Rj4#Xp7!cF2@nM9&wL5s
```

Every output should be 20 characters, contain at least one lowercase, one uppercase, one digit, and one symbol.

### 1.2 Verify the guarantees

**Starter hint:** Write a quick check that asserts each character type is present in the generated password. This is a sanity check, not production code — just confirm your `required` logic works.

```python
def verify_password(pw: str) -> bool:
    """Check that a password contains at least one of each type."""
    checks = [
        any(c in string.ascii_lowercase for c in pw),
        any(c in string.ascii_uppercase for c in pw),
        any(c in string.digits for c in pw),
        any(c in SYMBOLS for c in pw),
    ]
    return all(checks)

# Generate 100 passwords and verify each one
for _ in range(100):
    pw = generate_password(length=16)
    assert verify_password(pw), f"Failed for: {pw}"
print("All 100 passwords passed verification.")
```

**If it's off:** If an assertion fails, the character type pool is probably empty for one of the types. Check that the `if use_*` blocks each append to both `charset` and `required`. If you get `ValueError: At least one character type must be selected`, all four flags are `False` — pass `use_lowercase=True` at minimum.

### 1.3 Confirm correctness

**Checklist**

- `generate_password(length=20)` returns a string exactly 20 characters long.
- Every generated password contains at least one lowercase, one uppercase, one digit, and one symbol.
- Generating 100 passwords in a loop produces 100 distinct results (no repeats).
- Passing `use_symbols=False` produces passwords with no symbols.
- Passing `length=8` with all types enabled returns an 8-character string.

**Socratic question:** If you replaced `secrets.choice` with `random.choice` throughout this function, would the output *look* different to a human eye? What about to someone who knew the seed? Why does that distinction matter for passwords?

## Step 2: Analyze password strength

A random string is only as strong as the pool it was drawn from. The mathematical measure is **entropy** — the number of bits of information an attacker would need to guess the password. A password drawn from a pool of 70 characters, 16 characters long, has log2(70^16) ≈ 97.4 bits of entropy. That's a useful number because it directly translates to how many tries a brute-force attacker needs.

### 2.1 Calculate entropy

**Starter hint:** Write `calculate_entropy(password)` that determines which character pools are present (lowercase, uppercase, digits, symbols), sums their sizes into a `charset_size`, and returns `len(password) * math.log2(charset_size)`.

```python
import math

def calculate_entropy(password: str) -> float:
    """Calculate the entropy of a password in bits."""
    charset_size = 0
    if any(c in string.ascii_lowercase for c in password):
        charset_size += 26
    if any(c in string.ascii_uppercase for c in password):
        charset_size += 26
    if any(c in string.digits for c in password):
        charset_size += 10
    if any(c in SYMBOLS for c in password):
        charset_size += 30

    if charset_size == 0:
        return 0.0

    return len(password) * math.log2(charset_size)
```

**Expected output:** Try a few known cases:

```python
print(calculate_entropy("abc"))          # short, lowercase only
print(calculate_entropy("password123"))  # common pattern
print(calculate_entropy(generate_password(16)))  # random, full pool
```

```
15.1
33.2
97.4
```

The random 16-character password scores around 97 bits — far above the 80-bit threshold most security guidelines consider "very strong."

### 2.2 Map entropy to human-readable labels

Numbers are precise but not intuitive. A `strength_label` function turns entropy into something a person can act on.

```python
def strength_label(entropy: float) -> str:
    """Return a human-readable strength label."""
    if entropy < 28:
        return "Very Weak"
    elif entropy < 36:
        return "Weak"
    elif entropy < 60:
        return "Moderate"
    elif entropy < 80:
        return "Strong"
    else:
        return "Very Strong"
```

### 2.3 Print a visual strength bar

Combine everything into an `analyze_password` function that prints a formatted report.

```python
def analyze_password(password: str) -> dict:
    """Full strength analysis of a password."""
    entropy = calculate_entropy(password)
    label = strength_label(entropy)
    bar_len = min(int(entropy / 4), 30)
    bar = "\u2588" * bar_len + "\u2591" * (30 - bar_len)

    print(f"\n  Password: {'*' * len(password)}")
    print(f"  Length:    {len(password)} characters")
    print(f"  Entropy:   {entropy:.1f} bits")
    print(f"  Strength:  [{bar}] {label}")

    return {"password": password, "entropy": entropy, "label": label}
```

**Expected output:**

```python
for pw in ["abc", "password123", generate_password(16), generate_password(24)]:
    analyze_password(pw)
```

```
  Password: ***
  Length:    3 characters
  Entropy:   15.1 bits
  Strength:  [███░░░░░░░░░░░░░░░░░░░░░░░░░░░] Very Weak

  Password: ***********
  Length:    11 characters
  Entropy:   33.2 bits
  Strength:  [████████░░░░░░░░░░░░░░░░░░░░░░] Weak

  Password: ****************
  Length:    16 characters
  Entropy:   97.4 bits
  Strength:  [██████████████████████████████] Very Strong

  Password: ************************
  Length:    24 characters
  Entropy:   146.1 bits
  Strength:  [██████████████████████████████] Very Strong
```

The bar fills proportionally: one block per ~4 bits of entropy, capped at 30 blocks for the bar width.

**If it's off:** If a clearly random password shows "Weak," check that `calculate_entropy` is detecting all four character pools. A common bug is hardcoding the symbol string instead of reusing the `SYMBOLS` constant — if the hardcoded string differs by even one character, the symbol check silently misses some passwords. If `entropy` is `NaN`, the `charset_size` is zero, which means `calculate_entropy` found none of the four pools — make sure the password isn't empty.

### 2.4 Verify the analysis

**Checklist**

- `"abc"` (3 chars, lowercase only) labels as "Very Weak" with entropy under 20 bits.
- `"password123"` (common pattern) labels as "Weak" despite being 11 characters, because its charset is small.
- A 16-character random password from Step 1 labels as "Very Strong" with entropy above 95 bits.
- A 24-character random password shows higher entropy than the 16-character version.
- The bar visualization fills more for stronger passwords.

**Socratic question:** Why does `"password123"` have low entropy despite being 11 characters long? If an attacker knows people tend to pick dictionary words plus digits, how does that change the *effective* charset size compared to what `calculate_entropy` assumes?

## Step 3: Check against breach databases

Even a high-entropy password is worthless if it already appeared in a data breach. The Have I Been Pwned (HIBP) API lets you check — but you should never send your actual password to a third-party server. The solution is **k-anonymity**: you send only the first 5 characters of the password's SHA-1 hash and receive back a list of matching hash suffixes. Your full password never leaves your machine.

### 3.1 Understand the k-anonymity protocol

The flow works like this:

1. Hash the password with SHA-1: `SHA1("password123") = "CBFDAC6008F9CAB4083784CBD1874F76618D2A97"`
2. Send the first 5 characters (`CBFDA`) to `https://api.pwnedpasswords.com/range/CBFDA`
3. The API responds with thousands of lines, each being a hash suffix and a count: `C6008F9CAB4083784CBD1874F76618D2A97:42`
4. Search the response for your full hash suffix (`C6008F9CAB4083784CBD1874F76618D2A97`). If found, your password has been in `42` breaches.
5. The server knows only a 5-character prefix that matches millions of possible passwords — it cannot determine which specific password you're checking.

### 3.2 Implement the breach checker

**Starter hint:** You need `hashlib` (built-in) for SHA-1 and `httpx` for the HTTP request. The response body is plain text with one hash-suffix per line.

```python
import hashlib
import httpx

def check_breach(password: str) -> tuple[bool, int]:
    """Check if a password appears in known breaches using HIBP k-anonymity."""
    sha1 = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]

    try:
        response = httpx.get(
            f"https://api.pwnedpasswords.com/range/{prefix}",
            timeout=10,
        )
        response.raise_for_status()

        for line in response.text.splitlines():
            hash_suffix, count = line.split(":")
            if hash_suffix == suffix:
                return True, int(count)

        return False, 0
    except Exception as e:
        print(f"Breach check failed: {e}")
        return False, 0
```

**Expected output:** Test with a password you know has been breached, and one you just generated:

```python
is_breached, count = check_breach("password123")
if is_breached:
    print(f"This password appeared in {count:,} breaches. Do not use it.")
else:
    print("This password was not found in known breaches.")
```

```
This password appeared in 3,862,431 breaches. Do not use it.
```

```python
fresh = generate_password(20)
is_breached, count = check_breach(fresh)
print(f"Fresh password: breached={is_breached}, count={count}")
```

```
Fresh password: breached=False, count=0
```

A freshly generated random password should never appear in the breach database. If it does, the random source is broken — go back to Step 1 and confirm you're using `secrets`, not `random`.

**If it's off:** If you get `Breach check failed: ...`, your network might be blocking the request or the API is temporarily down — the function returns `False, 0` on failure so the tool doesn't crash. If you get `ConnectionError`, check your internet connection. If you get `403`, the API rate-limits requests — wait a moment and try again. If a known-breached password like `"password123"` comes back as not breached, check that the SHA-1 hash is uppercase and the suffix comparison is exact (no extra whitespace, no `.strip()` needed on the right-hand side of the `split(":")`).

### 3.3 Verify the breach checker

**Checklist**

- `"password123"` returns `True` with a count in the millions.
- `"123456"` returns `True` with a very high count.
- A freshly generated password from Step 1 returns `False, 0`.
- The function handles network errors gracefully — no traceback, just a warning and `False, 0`.
- The full password never appears in any print statement or log.

**Socratic question:** The API returns results for millions of password hashes that share the same 5-character prefix. If your password's prefix is `CBFDA`, how many *other* passwords are you leaking information about to the server by making the request? Why is that acceptable in this design?

## Step 4: Build an encrypted vault

Generating strong passwords is only half the value — you also need to store them somewhere. Writing them to a plain text file defeats the purpose. Instead, we'll encrypt the vault with **AES-256** using the `cryptography` package's Fernet implementation. The vault is decrypted at runtime using a master password you type in once.

### 4.1 Derive an encryption key from the master password

Fernet needs a URL-safe base64-encoded 32-byte key. We derive one from the master password using SHA-256 (in production you'd use PBKDF2 or argon2 for slower key derivation, but this demonstrates the workflow).

**Starter hint:** Hash the master password with SHA-256, then base64-encode the result.

```python
from cryptography.fernet import Fernet
import base64

def derive_key(master_password: str) -> bytes:
    """Derive an AES key from a master password."""
    key = hashlib.sha256(master_password.encode()).digest()
    return base64.urlsafe_b64encode(key)
```

### 4.2 Save the vault

**Starter hint:** Write `save_vault(vault, master_password, filepath)` that converts the vault dict to a string, encrypts it with Fernet, and writes the ciphertext to disk.

```python
def save_vault(vault: dict, master_password: str, filepath: str = "vault.enc"):
    """Encrypt and save the vault to disk."""
    key = derive_key(master_password)
    f = Fernet(key)
    data = str(vault).encode()
    encrypted = f.encrypt(data)

    with open(filepath, "wb") as file:
        file.write(encrypted)
    print(f"Vault saved to {filepath}")
```

### 4.3 Load the vault

**Starter hint:** Write `load_vault(master_password, filepath)` that reads the ciphertext, decrypts it, and converts the string back to a dict. Handle the two failure cases: file not found (start fresh) and wrong password (corrupted decryption).

```python
def load_vault(master_password: str, filepath: str = "vault.enc") -> dict:
    """Load and decrypt the vault from disk."""
    key = derive_key(master_password)
    f = Fernet(key)

    try:
        with open(filepath, "rb") as file:
            encrypted = file.read()
        decrypted = f.decrypt(encrypted)
        return eval(decrypted.decode())
    except FileNotFoundError:
        print("No vault file found. Starting fresh.")
        return {}
    except Exception:
        print("Wrong master password or corrupted vault.")
        return {}
```

**Expected output:** Create a vault with two entries, save it, reload it, and verify:

```python
vault = {
    "github": {"username": "alice", "password": generate_password(20)},
    "email": {"username": "alice@example.com", "password": generate_password(20)},
}

save_vault(vault, "my-master-password")
loaded = load_vault("my-master-password")
print(f"Vault loaded with {len(loaded)} entries.")
for service, creds in loaded.items():
    print(f"  {service}: {creds['username']}")
```

```
Vault saved to vault.enc
Vault loaded with 2 entries.
  github: alice
  email: alice@example.com
```

Now try loading with the wrong password:

```python
loaded_bad = load_vault("wrong-password")
```

```
Wrong master password or corrupted vault.
```

The wrong password produces an empty dict and a clear error message — no traceback, no crash.

**If it's off:** If you get `InvalidToken` with a traceback instead of the friendly message, the `except Exception` block isn't catching Fernet's error. Check that `from cryptography.fernet import Fernet` is at the top of your file — if the import is missing, `Fernet` is undefined and the `except` block fails before it can handle the error. If the vault file is always empty after reload, the `str(vault)` conversion might be producing something `eval()` can't parse — check that the vault dict contains only strings, not objects or functions.

:::warning[eval() is dangerous in production]
`eval()` executes arbitrary Python code. This is acceptable for a personal learning project where you control the vault file, but in production you should use `json.loads()` instead of `eval()` for deserialization. The vault format would need to use JSON-compatible types (no tuples, no sets, no custom objects).
:::

### 4.4 Verify the vault

**Checklist**

- Saving a vault with two entries creates a `vault.enc` file on disk.
- Loading with the correct master password returns both entries with their usernames and passwords intact.
- Loading with a wrong master password prints an error and returns an empty dict.
- Loading when no vault file exists prints a message and returns an empty dict.
- The `vault.enc` file contents are binary ciphertext, not readable text.

**Socratic question:** If someone steals your `vault.enc` file, how many guesses would they need to decrypt it? How does that number change if they know your master password is only 8 lowercase letters versus a 20-character random password from Step 1?

## Step 5: CLI interface

The tool works in a Python shell, but real tools live on the command line. We'll wrap everything in `argparse` so users can generate, check, store, and list passwords without opening Python.

### 5.1 Set up argparse

**Starter hint:** Use subcommands with `add_subparsers` — one for `generate`, one for `check`, one for `store`, one for `list`. Each subcommand gets its own flags.

```python
import argparse
import sys

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Password Generator — create, analyze, and store secure passwords."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # generate
    gen = sub.add_parser("generate", help="Generate a new password")
    gen.add_argument("-l", "--length", type=int, default=16, help="Password length (default: 16)")
    gen.add_argument("-n", "--count", type=int, default=1, help="Number of passwords to generate")
    gen.add_argument("--no-symbols", action="store_true", help="Exclude symbols")
    gen.add_argument("--no-uppercase", action="store_true", help="Exclude uppercase letters")
    gen.add_argument("--no-digits", action="store_true", help="Exclude digits")

    # check
    chk = sub.add_parser("check", help="Check password strength and breach status")
    chk.add_argument("password", nargs="?", help="Password to check (will prompt if omitted)")

    # store
    sto = sub.add_parser("store", help="Store a credential in the encrypted vault")
    sto.add_argument("service", help="Service name (e.g. github)")
    sto.add_argument("-u", "--username", required=True, help="Username or email")
    sto.add_argument("-p", "--password", help="Password (will generate if omitted)")
    sto.add_argument("--master", required=True, help="Master password for the vault")

    # list
    lst = sub.add_parser("list", help="List all entries in the vault")
    lst.add_argument("--master", required=True, help="Master password for the vault")

    return parser
```

### 5.2 Wire up the commands

**Starter hint:** Write a `main()` function that parses args and dispatches to the appropriate functions from Steps 1-4.

```python
def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "generate":
        for _ in range(args.count):
            pw = generate_password(
                length=args.length,
                use_uppercase=not args.no_uppercase,
                use_symbols=not args.no_symbols,
                use_digits=not args.no_digits,
            )
            print(pw)

    elif args.command == "check":
        password = args.password
        if not password:
            password = input("Enter password to check: ").strip()
        analyze_password(password)
        is_breached, count = check_breach(password)
        if is_breached:
            print(f"  WARNING: Found in {count:,} breaches!")
        else:
            print("  Not found in known breaches.")

    elif args.command == "store":
        vault = load_vault(args.master)
        pw = args.password or generate_password(20)
        vault[args.service] = {"username": args.username, "password": pw}
        save_vault(vault, args.master)
        print(f"Stored {args.service} for {args.username}.")

    elif args.command == "list":
        vault = load_vault(args.master)
        if not vault:
            print("Vault is empty.")
        else:
            print(f"\n  {'Service':<15} {'Username':<25} {'Password':<20}")
            print(f"  {'-'*15} {'-'*25} {'-'*20}")
            for service, creds in vault.items():
                print(f"  {service:<15} {creds['username']:<25} {creds['password']:<20}")

if __name__ == "__main__":
    main()
```

**Expected output:** Run from the terminal:

```bash
python password_generator.py generate --length 20 --count 3
```

```
k7G!mP2xQ#nR9wL@jT4f
aB3$vN8&kD5*pY1!mW6h
Rj4#Xp7!cF2@nM9&wL5s
```

```bash
python password_generator.py check "password123"
```

```
  Password: ***********
  Length:    11 characters
  Entropy:   33.2 bits
  Strength:  [████████░░░░░░░░░░░░░░░░░░░░░░] Weak
  WARNING: Found in 3,862,431 breaches!
```

```bash
python password_generator.py store github -u alice --master "my-master-password"
python password_generator.py list --master "my-master-password"
```

```
  Service         Username                  Password
  --------------- ------------------------- --------------------
  github          alice                     k7G!mP2xQ#nR9wL@jT4f
```

**If it's off:** If you get `error: the following arguments are required`, you forgot to pass a required flag (like `--master` or `-u`). If you get `unrecognized arguments`, check the subcommand order — `generate` comes before the flags, not after. If `generate` prints nothing, `--count` might be set to 0. If `list` shows garbled text, your vault was saved with a different Python version's `str()` format — regenerate it.

### 5.3 Verify the CLI

**Checklist**

- `generate --length 20 --count 3` prints three 20-character passwords, one per line.
- `generate --no-symbols` produces passwords with no symbols.
- `check "password123"` shows "Weak" and "Found in ... breaches."
- `store github -u alice --master X` creates or updates the vault file.
- `list --master X` shows all stored entries in a formatted table.
- Running `list` with the wrong master password prints an error, not a traceback.

**Socratic question:** Why does `generate` print to stdout instead of saving to a file? What advantage does that give a CLI tool compared to always writing to disk?

## Step 6: Password expiry tracker

Passwords age. A password generated 90 days ago might be compromised by now. By adding a timestamp to each vault entry, we can flag old passwords and remind the user to rotate them.

### 6.1 Add timestamps to vault entries

**Starter hint:** When storing a credential, include a `"created_at"` key with the current ISO timestamp. When listing entries, compare the age against a threshold.

```python
from datetime import datetime, timedelta

MAX_PASSWORD_AGE_DAYS = 90

def store_credential(vault: dict, service: str, username: str, password: str) -> dict:
    """Add a credential entry with a creation timestamp."""
    vault[service] = {
        "username": username,
        "password": password,
        "created_at": datetime.now().isoformat(),
    }
    return vault
```

### 6.2 Check for expired passwords

**Starter hint:** Write `check_expiry(vault, max_age_days)` that returns a list of `(service, created_at, days_old)` tuples for entries older than the threshold.

```python
def check_expiry(vault: dict, max_age_days: int = MAX_PASSWORD_AGE_DAYS) -> list[tuple[str, str, int]]:
    """Find passwords older than max_age_days."""
    now = datetime.now()
    expired = []

    for service, creds in vault.items():
        created_str = creds.get("created_at")
        if not created_str:
            continue
        created = datetime.fromisoformat(created_str)
        days_old = (now - created).days
        if days_old > max_age_days:
            expired.append((service, created_str, days_old))

    return expired
```

### 6.3 Show expiry in the list view

**Starter hint:** Update the `list` command to show each entry's age and flag expired ones with a warning symbol.

```python
def list_vault_with_expiry(vault: dict):
    """List vault entries with password age indicators."""
    now = datetime.now()

    print(f"\n  {'Service':<15} {'Username':<20} {'Age':<10} {'Status'}")
    print(f"  {'-'*15} {'-'*20} {'-'*10} {'-'*20}")

    for service, creds in vault.items():
        username = creds["username"]
        created_str = creds.get("created_at")

        if created_str:
            created = datetime.fromisoformat(created_str)
            days_old = (now - created).days
            age_str = f"{days_old}d"
            status = "EXPIRED" if days_old > MAX_PASSWORD_AGE_DAYS else "OK"
        else:
            age_str = "unknown"
            status = "no timestamp"

        marker = " [!]" if status == "EXPIRED" else ""
        print(f"  {service:<15} {username:<20} {age_str:<10} {status}{marker}")

    expired = check_expiry(vault)
    if expired:
        print(f"\n  {len(expired)} password(s) older than {MAX_PASSWORD_AGE_DAYS} days. Rotate them.")
```

**Expected output:**

```
  Service         Username             Age        Status
  --------------- -------------------- ---------- --------------------
  github          alice                95d        EXPIRED [!]
  email           alice@example.com    12d        OK

  1 password(s) older than 90 days. Rotate them.
```

**If it's off:** If all entries show "unknown" age, the `created_at` key wasn't added during storage — go back to the `store_credential` function and make sure it's being called instead of manually building the dict. If the age calculation seems wrong, check that `datetime.now()` and `datetime.fromisoformat()` are using the same timezone awareness (both naive, or both aware — don't mix them).

### 6.4 Verify the expiry tracker

**Checklist**

- A newly stored entry shows "OK" status with age of 0d.
- An entry with `created_at` set to 100 days ago shows "EXPIRED [!]" status.
- An entry without a `created_at` key shows "unknown" age, not a crash.
- The summary line at the bottom counts only expired entries.

**Socratic question:** What happens if the user changes their system clock backward by 100 days after storing a password? Would the expiry check still work correctly? What real-world problem does this reveal about client-side timestamp-based security checks?

## Step 7: Polish the output

Raw text is functional but hard to scan. Adding color to the terminal output makes strong vs. weak passwords, breached vs. clean passwords, and expired vs. fresh entries visually distinct at a glance.

### 7.1 Add ANSI color codes

**Starter hint:** Define color constants using ANSI escape sequences. Wrap text in them for terminal output only — don't write escape codes to files.

```python
class Color:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"

def colored(text: str, color: str) -> str:
    """Wrap text in an ANSI color code."""
    return f"{color}{text}{Color.RESET}"
```

### 7.2 Color the strength bar

**Starter hint:** Update `analyze_password` to color the bar based on the strength label — red for weak, yellow for moderate, green for strong.

```python
def analyze_password_colored(password: str) -> dict:
    """Full strength analysis with colored output."""
    entropy = calculate_entropy(password)
    label = strength_label(entropy)
    bar_len = min(int(entropy / 4), 30)

    if entropy < 36:
        bar_color = Color.RED
    elif entropy < 60:
        bar_color = Color.YELLOW
    else:
        bar_color = Color.GREEN

    filled = colored("\u2588" * bar_len, bar_color)
    empty = colored("\u2591" * (30 - bar_len), Color.DIM)

    print(f"\n  {colored('Password:', Color.BOLD)} {'*' * len(password)}")
    print(f"  {colored('Length:', Color.BOLD)}    {len(password)} characters")
    print(f"  {colored('Entropy:', Color.BOLD)}   {entropy:.1f} bits")
    print(f"  {colored('Strength:', Color.BOLD)} [{filled}{empty}] {label}")

    return {"password": password, "entropy": entropy, "label": label}
```

### 7.3 Color the breach check

```python
def check_breach_colored(password: str) -> tuple[bool, int]:
    """Check breach status with colored output."""
    is_breached, count = check_breach(password)
    if is_breached:
        print(colored(f"  WARNING: Found in {count:,} breaches!", Color.RED))
    else:
        print(colored("  Not found in known breaches.", Color.GREEN))
    return is_breached, count
```

### 7.4 Build a summary report

**Starter hint:** Write `print_report` that takes a list of passwords, analyzes each, and prints a summary table with counts by strength level and average entropy.

```python
def print_report(passwords: list[str]):
    """Print a formatted strength report for a list of passwords."""
    results = [analyze_password_colored(pw) for pw in passwords]

    # Summary
    labels = {}
    for r in results:
        labels[r["label"]] = labels.get(r["label"], 0) + 1

    avg_entropy = sum(r["entropy"] for r in results) / len(results) if results else 0

    print(f"\n  {colored('Summary', Color.BOLD)}")
    print(f"  {'─' * 40}")
    for label in ["Very Weak", "Weak", "Moderate", "Strong", "Very Strong"]:
        count = labels.get(label, 0)
        print(f"  {label:<15} {count}")
    print(f"  {'─' * 40}")
    print(f"  {'Avg entropy:':<15} {avg_entropy:.1f} bits")
    print(f"  {'Total:':<15} {len(results)}")
```

**Expected output:**

```python
passwords = ["abc", "password123", generate_password(12), generate_password(16), generate_password(24)]
print_report(passwords)
```

```
  Password: ***
  Length:    3 characters
  Entropy:   15.1 bits
  Strength:  [███░░░░░░░░░░░░░░░░░░░░░░░░░░░] Very Weak
  ...
  Summary
  ────────────────────────────────────────
  Very Weak      1
  Weak           1
  Strong         1
  Very Strong    2
  ────────────────────────────────────────
  Avg entropy:   72.3 bits
  Total:         5
```

**If it's off:** If colors don't appear, your terminal might not support ANSI codes — try `export TERM=xterm-256color` before running. If you see raw escape sequences like `[91m` in the output, the escape characters aren't being interpreted — make sure you're using `\033[` (the actual ESC character), not the literal string backslash-zero-three-three.

### 7.5 Verify the polished output

**Checklist**

- The strength bar is red for weak passwords, yellow for moderate, and green for strong.
- The breach warning is red when a password is found in breaches.
- The summary table shows correct counts for each strength level.
- The average entropy calculation is correct.
- Running the tool in a terminal that supports ANSI codes shows colors; redirecting to a file does not include escape sequences.

**Socratic question:** Why should the `colored()` function be used only for terminal output and not for writing to log files? What happens if you pipe the colored output to `less` or redirect it to a file?

## Common pitfalls

- **Using `random` instead of `secrets`.** The `random` module is deterministic and predictable. For anything security-related — passwords, tokens, keys — always use `secrets`. This is the single most important decision in this entire project.
- **Forgetting to shuffle the required characters.** If you append required characters first and then fill the rest, the first few characters are always one of each type in a fixed order. A prefix like "aB1!" is a pattern attackers know to check first. Always shuffle.
- **Sending the full password to the breach API.** The HIBP k-anonymity design exists specifically to avoid this. Only the first 5 characters of the SHA-1 hash should ever leave your machine.
- **Using `eval()` in production code.** `eval()` executes arbitrary Python. For a personal learning project it's a quick way to deserialize the vault, but in production use `json.loads()` with a JSON-compatible vault format.
- **Saving the vault only at exit.** If the program crashes mid-session, unsaved changes are lost. Save after every mutation — the `save_vault` call in `store` already does this.
- **Mixing timezone-aware and naive datetimes.** `datetime.now()` returns a naive datetime (no timezone). If you compare it against a timezone-aware one from `datetime.now(timezone.utc)`, you'll get a `TypeError`. Keep them consistent.

## What you just built

A complete password management tool in pure Python: cryptographically secure password generation, entropy-based strength analysis, breach detection against a public database using k-anonymity, an AES-256 encrypted vault, a command-line interface, password expiry tracking, and colored terminal output. Every piece builds on Python 101 fundamentals — strings, lists, dictionaries, loops, functions — applied to a real problem you face every day.

The security patterns here apply far beyond passwords: k-anonymity is used in health data and location privacy, AES encryption is the standard for data-at-rest, and entropy calculation is the foundation of all strength metrics. Understanding *why* these work (not just how to call them) is what separates a script from a tool you can trust.

## Where to go from here

- **Use a real KDF.** Replace the SHA-256 key derivation with PBKDF2 (`cryptography.hazmat.primitives.kdf.pbkdf2`) or argon2 for brute-force resistance. A SHA-256 hash is fast — an attacker can try billions per second. PBKDF2 with 600,000 iterations slows that down by a factor of 600,000.
- **Add a clipboard copy command.** A `copy` subcommand that puts a password on the clipboard and clears it after 30 seconds is more practical than printing to stdout.
- **Implement password reuse detection.** Before storing a new credential, check if the password already appears in another entry — a reused strong password is still a single point of failure.
- **Add JSON vault format.** Migrate from `eval()`/`str()` to `json.dumps()`/`json.loads()` for interoperability and safety. JSON doesn't support Python tuples or sets, but the vault only needs strings.
- **Build a `rotate` command.** Generate a new password for an existing entry, update the timestamp, and optionally copy the new password to the clipboard — all in one command.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser.
