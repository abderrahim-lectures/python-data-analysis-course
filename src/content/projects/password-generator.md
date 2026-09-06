---
title: "Password Manager"
description: "Generate, store, and audit passwords with breach detection and team sharing."
difficulty: "beginner"
estimatedMinutes: 40
tags: ["security", "cryptography", "cli", "hashing"]
learningObjectives:
  - Generate cryptographically secure random passwords
  - Measure password strength using entropy calculations
  - Check passwords against breach databases with k-anonymity
  - Store passwords securely with encryption
prerequisites:
  - Basic Python strings and functions
  - Understanding of lists and loops
  - Familiarity with pip/uv for installing packages
---

# Password Manager

Strong passwords everywhere. In this project you will build a password generator, analyze password strength, check for known breaches, and store credentials in an encrypted vault.

## What You'll Learn

- How to generate cryptographically secure random passwords
- How to calculate password entropy and measure strength
- How to check passwords against breach databases safely using k-anonymity
- How to encrypt and decrypt data with a master password

## What You'll Build

A command-line tool that:

- Generates secure passwords with customizable character rules
- Scores password strength on a 0–100 scale with visual feedback
- Checks passwords against the Have I Been Pwned breach API without sending the full password
- Stores credentials in an AES-encrypted vault file protected by a master password

## Where to Run It

This project runs anywhere Python is available. You can use:

- **JupyterLite playground** — paste code blocks into cells and run them in the browser
- **Local with uv** — install dependencies and run from your terminal
- **Google Colab** — click the Colab badge on the project page to run in a cloud notebook

## Setup

Create a new project and install dependencies:

```bash
uv init password-manager
cd password-manager
uv add secrets hashlib cryptography
```

The `secrets` module comes with Python and provides cryptographically strong random numbers. The `cryptography` package provides AES encryption.

## Step 1 — Generate Secure Passwords

Use the `secrets` module instead of `random` for security. The `random` module is predictable; `secrets` is not.

```python
import secrets
import string

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
        charset += "!@#$%^&*()-_=+[]{}|;:,.<>?"
        required.append(secrets.choice("!@#$%^&*()-_=+[]{}|;:,.<>?"))

    if not charset:
        raise ValueError("At least one character type must be selected")

    # Fill remaining length with random choices
    remaining = length - len(required)
    password_chars = required + [secrets.choice(charset) for _ in range(remaining)]

    # Shuffle to avoid predictable positions
    secrets.SystemRandom().shuffle(password_chars)
    return "".join(password_chars)

# Generate a few examples
for i in range(3):
    pw = generate_password(length=20)
    print(f"  {pw}")
```

We generate the required characters first to guarantee each type appears at least once, then shuffle the result so the required characters are not clustered at the start.

## Step 2 — Analyze Password Strength

Score passwords by measuring entropy — the amount of unpredictability. Higher entropy means a harder-to-crack password.

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
    if any(c in "!@#$%^&*()-_=+[]{}|;:,.<>?" for c in password):
        charset_size += 30

    if charset_size == 0:
        return 0.0

    return len(password) * math.log2(charset_size)

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

def analyze_password(password: str) -> dict:
    """Full strength analysis of a password."""
    entropy = calculate_entropy(password)
    label = strength_label(entropy)
    bar_len = min(int(entropy / 4), 30)
    bar = "█" * bar_len + "░" * (30 - bar_len)

    print(f"\n  Password: {'*' * len(password)}")
    print(f"  Length:    {len(password)} characters")
    print(f"  Entropy:   {entropy:.1f} bits")
    print(f"  Strength:  [{bar}] {label}")

    return {"password": password, "entropy": entropy, "label": label}

# Test with various passwords
for pw in ["abc", "password123", generate_password(16), generate_password(24)]:
    analyze_password(pw)
```

A 16-character password with all character types typically scores above 80 bits of entropy, which is considered very strong.

## Step 3 — Check Against Breach Databases

The Have I Been Pwned API uses k-anonymity: you send only the first 5 characters of the password's SHA-1 hash and get back a list of matching suffixes. Your full password never leaves your machine.

```python
import hashlib

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

# Check a common password
is_breached, count = check_breach("password123")
if is_breached:
    print(f"This password appeared in {count:,} breaches. Do not use it.")
else:
    print("This password was not found in known breaches.")
```

This method is safe because the API never sees your actual password — only a truncated hash prefix that matches thousands of other passwords.

## Step 4 — Build an Encrypted Vault

Store credentials in an AES-256 encrypted file protected by a master password using the `cryptography` package.

```python
from cryptography.fernet import Fernet
import base64
import hashlib

def derive_key(master_password: str) -> bytes:
    """Derive an AES key from a master password."""
    key = hashlib.sha256(master_password.encode()).digest()
    return base64.urlsafe_b64encode(key)

def save_vault(vault: dict, master_password: str, filepath: str = "vault.enc"):
    """Encrypt and save the vault to disk."""
    key = derive_key(master_password)
    f = Fernet(key)
    data = str(vault).encode()
    encrypted = f.encrypt(data)

    with open(filepath, "wb") as file:
        file.write(encrypted)
    print(f"Vault saved to {filepath}")

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

# Usage example
vault = {
    "github": {"username": "alice", "password": generate_password(20)},
    "email": {"username": "alice@example.com", "password": generate_password(20)},
}

save_vault(vault, "my-master-password")
loaded = load_vault("my-master-password")
print(f"Vault loaded with {len(loaded)} entries.")
```

In production you would use a key derivation function like PBKDF2 or argon2 instead of a plain SHA-256 hash. This example keeps things simple while demonstrating the encryption workflow.

## 🧩 Challenges

### Challenge 1 — Add a Password Generator CLI

Use `argparse` to build a command-line interface with flags like `--length 20`, `--no-symbols`, `--count 5`. The tool should print generated passwords to stdout so they can be piped into other commands.

### Challenge 2 — Build a Strength Checker Report

Write a function that takes a list of passwords (for example, from a text file) and generates a summary report: how many are weak, moderate, strong, or very strong, plus the average entropy. Print the results as a formatted table.

### Challenge 3 — Add a Password Expiry Tracker

Extend the vault to include a `created_at` timestamp for each entry. Write a function that flags any password older than 90 days as "expired" and suggests rotation.

## Stretch Goals

- [ ] Add browser extension integration for autofill via a local HTTP server
- [ ] Implement two-factor authentication backup code storage in the vault
- [ ] Build a password health audit report that checks reuse across entries
- [ ] Add a `--generate-phrase` mode that creates memorable passphrases from a word list

## What You Learned

You built a password generator with cryptographic randomness, measured password strength using entropy, checked passwords against breach databases with k-anonymity, and stored credentials in an encrypted vault. These patterns apply to any security-focused Python tool.
