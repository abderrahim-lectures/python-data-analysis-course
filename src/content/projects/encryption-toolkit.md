---
title: "Build an Encryption Toolkit"
description: "Encrypt messages and files with Fernet, derive keys from passwords, use hybrid RSA to share a session key, and sign what you mean."
difficulty: "intermediate"
estimatedMinutes: 80
tags: ["cli", "cryptography", "files", "security"]
prerequisites:
  - "Python basics (functions, files, bytes)"
  - "Comfortable editing and running scripts in the terminal"
learningObjectives:
  - "Encrypt and decrypt a message with a symmetric key"
  - "Derive a strong key from a password with PBKDF2 and a random salt"
  - "Encrypt and decrypt files on disk, proving round-trip integrity"
  - "Encrypt a shared session key with RSA public/private pairs"
  - "Sign a message and verify it against a tampered copy"
---

# 🔐 Build an Encryption Toolkit

"Keystore file. Build the it.", a real team asked for exactly this: a Python file that locks service secrets at rest. This project builds that toolkit from the ground up: one plaintext message → ciphertext, a password turned into a real key, a file that round-trips through encryption without a byte changing, RSA locking a session key so two sides can share a symmetric secret without sharing the secret itself, and a signature that proves a message is unmodified and sent by the holder of a private key. By the end you'll hold the five primitives every security library ships, used correctly.

This assumes Python 101, lists, dicts, functions, files, plus a comfort with bytes and `with open(...)`. The only dependency is `cryptography`, a first-party security library (used by pip, TLS, and GitHub's tooling) that gives up nothing to `openssl` for learning purposes, authenticated encryption, key derivation, and RSA all in one.

## 🎯 What you'll do

1. Generate a Fernet key and round-trip a message, ciphertext and back.
2. Derive a deterministic key from a password with PBKDF2 + random salt, and watch a wrong password produce garbage it can't unlock.
3. Encrypt a file to `.enc` and restore it byte-for-byte.
4. Wrap a Fermet session key with RSA so a recipient's public key unlocks it, but only their private key ever reads it.
5. Sign a message with your private key and verify both an untouched and a tampered copy.

## Where to run this

**Locally with `uv`** is the recommended path, key derivation and file encryption are local-CLI tools, and `uv` handles the `cryptography` dependency crisply.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work, the notebook at [`examples/encryption-toolkit/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/encryption-toolkit/notebook.ipynb) pre-installs `cryptography` and runs every step in memory.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/encryption-toolkit/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/encryption-toolkit/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fencryption-toolkit%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces "install Python, then pip, then a virtual environment tool", and the one third-party dependency, `cryptography`, installs in seconds.

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

Then set up the project with the cryptography package:

```bash
uv init encryption-toolkit
cd encryption-toolkit
uv add cryptography
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `uv add cryptography` finishes with "Prepared ... cryptography" in the log.
- ✅ `uv run python -c "from cryptography.fernet import Fernet"` succeeds.

## Step 1: Symmetric round-trip with a Fernet key

Encryption is a door: the *key* opens it, the *ciphertext* is what the door hides. Fernet is the "sensible default" of `cryptography`, AES-128-CBC plus a MAC, base64-encoded, one object whose `encrypt` and `decrypt` do the whole job. The round-trip invariant, `decrypt(encrypt(x)) == x`, is the property every later step leans on, so your very first demo proves it.

### 1.1 Put Fernet through its paces

**👟 Starter hint:** `Fernet.generate_key()` makes a fresh key; the same `Fernet(key)` object both encrypts and decrypts:

```python
# symmetric.py
from cryptography.fernet import Fernet

key = Fernet.generate_key()
print("key:", key.decode())

fernet = Fernet(key)
message = b"top secret: launch at midnight"
token = fernet.encrypt(message)
print("token:", token.decode())

plain = fernet.decrypt(token)
print("round-trip ok:", plain == message)
print("key bytes:", len(key))
print("token bytes:", len(token))
```

Run it:

```bash
uv run symmetric.py
```

`key` and `token` are URL-safe base64 text you could drop into a YAML config or log line, they *look* presentable and are exactly that deranged: `key` is the 32 random bytes Fernet needs, `token` is ciphertext plus a MAC plus a timestamp, and neither resembles the message in any human way. `decrypt` also verifies integrity: a mutated token raises `InvalidToken` instead of returning garbage, the MAC makes forgery detection free with every read.

**🎯 Expected output:** (`key`/`token` bytes differ on your machine, fresh random every run)

```
key: mlELRCZYDLnXiLKv6S3s0stB92jE_qVhxx6-R3AycKk=
token: gAAAAABqndOYC911dXqRml78PYZngKgnwQTQbqes0eTFGn7fd7H7ZbVrplSQ406cDYBvxK2D6yG64eKtpOy5Cni5n5i2C1bgjWzSdpCrM9vC9c_W7A7WfN4=
round-trip ok: True
key bytes: 44
token bytes: 120
```

**🩹 If it's off:** If `round-trip ok: False`, one of the two operations isn't using the same key, check no second `Fernet(...)` is constructing a fresh key. If `decrypt` raises `InvalidToken`, the `token` was written after `encrypt` (image editing away a trailing `=` breaks base64), or you decrypted a token from a *previous* run with a *new* key, the door needs the same key that locked it.

### 1.2 Verify the round-trip

**✅ Checklist**

- ✅ `key` is 44 chars (32 bytes, base64) and `token` 120 chars for a 25-byte message.
- ✅ `plain == message`, decryption returns the exact original bytes.
- ✅ Corrupting one character of `token` (change `A` to `B`) makes `decrypt` raise `InvalidToken`, not return wrong text.

**🤔 Socratic Question(s)**

- The key is stored, where? If this script writes `key` to a file beside the ciphertext, the lock is decorative: an attacker reads both. What minimum storage rule makes the key actually secret (separate file, environment variable, secret manager)?
- Fernet is *authenticated* encryption: decryption of a tampered token fails loudly. Why does that single behavior matter more for "config files at rest" than for a toy demo, what's the silent-alternative bug it prevents?

## Step 2: Derive a key from a password

Nobody remembers 32 random bytes; everybody remembers a password. PBKDF2 stretches a weak password into a strong key, *and* a hash, so `"correct-horse-battery-staple"` + the same salt always yields the same 32-byte key, while `"correct-horse-battery-staple"` + a different salt yields something unrelated. The salt is the memory aid: stored beside the hash, never secret, it scopes every derivation to this one user's keys.

### 2.1 Derive with PBKDF2

**👟 Starter hint:** `PBKDF2HMAC(hashes.SHA256(), length=32, salt=..., iterations=600_000).derive(password)`, the same salt, the same derivation, the same key:

```python
# keys.py
import os
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

def derive_key(password: bytes, salt: bytes, length: int = 32) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=length,
                     salt=salt, iterations=600_000)
    return kdf.derive(password)

password = b"correct-horse-battery-staple"
salt = os.urandom(16)

key1 = derive_key(password, salt)
key2 = derive_key(password, salt)
key_wrong = derive_key(b"wrong-password", salt)

print("same password + salt -> same key:", key1 == key2)
print("wrong password -> different key:", key1 != key_wrong)
print("key bytes:", len(key1))
print("salt bytes:", len(salt))
```

Run it:

```bash
uv run keys.py
```

The function is deliberate in what it omits: it takes a *password* and a *salt* and returns exactly `length` bytes, no persistence, no writing files, so the caller decides what to store. PBKDF2's `iterations=600_000` is the "speed bump": each derivation does 600k rounds of HMAC-SHA256, so brute-forcing a password costs the attacker six hundred thousand times more than it costs you. `os.urandom(16)` salts never repeat in practice, killing rainbow tables, and the price of repeating a salt is every derived key collapsing into one.

**🎯 Expected output:**

```
same password + salt -> same key: True
wrong password -> different key: True
key bytes: 32
salt bytes: 16
```

**🩹 If it's off:** If `same password + salt -> same key: False`, the `derive` call caught a copy of `salt` changed between calls (`os.urandom` inside the function would also do this, salt must be a passed-in value). If `iterations` is missing, welcome to the world of weak-key alarms: the demo still passes, but the key's brute-force cost just dropped six orders of magnitude.

### 2.2 Verify the derivation

**✅ Checklist**

- ✅ Same `(password, salt)` pair yields byte-identical keys in two separate calls.
- ✅ A one-word-wrong password yields a different 32-byte key even with the same salt.
- ✅ A new `os.urandom(16)` salt with the same password breaks the earlier key, salts scope keys.

**🤔 Socratic Question(s)**

- The salt is *not* a secret, yet dropping it makes the system weaker. What exactly does the salt protect against, and why is reusing one salt across all users the credential-stuffing equivalent?
- `600_000` iterations is a number from a benchmark, not a law. What forces it upward on a real server (CPU gains, GPU cracking rigs), and what's the cost of choosing too high a value (every app start, every login)?

## Step 3: Encrypt and decrypt files

Now the toolkit turns practical: encrypt `secret.txt` into `secret.txt.enc`, then restore it to `restored.txt`. The round-trip is the *whole contract*, plaintext in, ciphertext on disk, plaintext byte-for-byte back, and the win "ciphertext hides plaintext" is the thing a skeptic opens the `.enc` file to check.

### 3.1 Write the file encryptor

**👟 Starter hint:** Service functions take `src/dst/key` and return sizes; the demo drives them with a 32-byte plaintext and Fernet key:

```python
# encrypt_file.py
from cryptography.fernet import Fernet

def encrypt_file(src, dst, key):
    fernet = Fernet(key)
    with open(src, "rb") as f:
        ciphertext = fernet.encrypt(f.read())
    with open(dst, "wb") as f:
        f.write(ciphertext)
    return len(ciphertext)

def decrypt_file(src, dst, key):
    fernet = Fernet(key)
    with open(src, "rb") as f:
        plaintext = fernet.decrypt(f.read())
    with open(dst, "wb") as f:
        f.write(plaintext)
    return len(plaintext)

if __name__ == "__main__":
    from pathlib import Path
    key = Fernet.generate_key()

    Path("secret.txt").write_bytes(b"meeting moved to the labs at 9pm")
    before = Path("secret.txt").read_bytes()

    size_enc = encrypt_file("secret.txt", "secret.txt.enc", key)
    restored = decrypt_file("secret.txt.enc", "restored.txt", key)

    print(f"plaintext size:  {len(before):4d} bytes")
    print(f"ciphertext size: {size_enc:4d} bytes")
    print(f"restored matches: {Path('restored.txt').read_bytes() == before}")
    print(f"ciphertext hides plaintext: {b'labs' not in Path('secret.txt.enc').read_bytes()}")
```

Run it:

```bash
uv run encrypt_file.py
```

Two mirror-image functions (encrypt reads text, writes ciphertext; decrypt reads ciphertext, writes text) make the pipeline read left-to-right before you even run it. `Path.write_bytes`/`read_bytes` hide the `with` boilerplate and keep the demo short; the real files live on disk, so *you* can `cat secret.txt.enc` afterwards and confirm nothing readable survives. The ciphertext is 140 bytes against 32 plaintext, Fernet's MAC plus its version block, the tax you pay for authenticated encryption, and it is entirely worth it.

**🎯 Expected output:**

```
plaintext size:   32 bytes
ciphertext size:  140 bytes
restored matches: True
ciphertext hides plaintext: True
```

**🩹 If it's off:** If `restored matches: False`, the decrypt's `src` pointed at the *original* file (no `.enc`) or the key differs between the two calls, decrypt the ciphertext with the tag same key that produced it. If sizes come back `0`, the script wrote bytes to `secret.txt.enc` using `open(dst, "w")` (text mode), encryption needs `"wb"`/`"rb"`, binary mode both ways.

### 3.2 Verify the file round-trip

**✅ Checklist**

- ✅ `secret.txt.enc` exists, is 108 bytes bigger than the source, and `cat` shows only base64 gibberish.
- ✅ `restored.txt` is byte-identical to `secret.txt` (the `==` check, not an eyeball).
- ✅ Deleting `restored.txt` and re-running only `decrypt_file` reproduces it, idempotent reads.

**🤔 Socratic Question(s)**

- `encrypt_file` zips the whole file into one Fernet token, fine for a 32-byte note. For a 2 GB backup, a single token means a single MAC failure kills the whole file after decrypting nothing. What's the operational shape of a *streaming* encryptor, and why might a real tool still choose whole-file for config-sized payloads?
- The `.enc` extension and `barrel ciphertext` naming is a convention, not a guarantee. Where in this toolkit would you *prove* (not imply) that a decrypting partner has the right key, before they trust the "restored" bytes?

## Step 4: Wrap a session key with RSA (hybrid encryption)

RSA encrypts at most ~245 bytes of a 2048-bit key, useless for a 2 GB file, ideal for the *session key* your file's Fernet uses. This is hybrid encryption, the architecture behind TLS: encrypt the payload with fast symmetric Fernet, wrap the small symmetric key with slow-but-shareable RSA, and transfer only the wrapped key. The recipient's *public* key encrypts; only their *private* key decrypts.

### 4.1 Encrypt a payload, wrap the key

**👟 Starter hint:** Generate an RSA pair, encrypt the message with a fresh Fernet key, then `public_key.encrypt(session_key, padding.OAEP(...))`, and unwrap on the private side:

```python
# hybrid.py
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()
print("RSA key size (bits):", private_key.key_size)

message = b"launch at midnight; team Tango is clear to deploy"
session_key = Fernet.generate_key()
fernet = Fernet(session_key)

ciphertext = fernet.encrypt(message)

wrapped = public_key.encrypt(
    session_key,
    padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),
                 algorithm=hashes.SHA256(), label=None),
)
print("wrapped key length (bytes):", len(wrapped))

unwrapped = private_key.decrypt(
    wrapped,
    padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),
                 algorithm=hashes.SHA256(), label=None),
)
print("hybrid round-trip ok:", Fernet(unwrapped).decrypt(ciphertext) == message)
```

Run it:

```bash
uv run hybrid.py
```

Each side of the handoff does exactly one job: `public_key.encrypt` wraps the *key* (2048-bit RSA, so the ~32-byte session key fits with OAEP padding, that's why wrapped length is 256, the RSA modulus size). The *payload* stays on Fernet, which is why the message text never touches RSA at all. Decrypting means reconstructing the session key first, `unwrapped` feeds straight back into `Fernet(...)` and the round-trip closes. There is no way to read the message with the private key alone or the session key alone; cryptography is an AND, and this code makes that visible.

**🎯 Expected output:**

```
RSA key size (bits): 2048
wrapped key length (bytes): 256
hybrid round-trip ok: True
```

**🩹 If it's off:** If `public_key.encrypt` raises `ValueError: too large`, your `session_key` exceeded OAEP's ~245-byte capacity, that's expected for real payloads and exactly why the scheme is hybrid (Fernet carries the message, RSA only the key). If decryption fails with the same-looking padding, one side's `MGF1`/`algorithm` combo differs, padding params must match on encrypt and decrypt precisely.

### 4.2 Verify the hybrid handoff

**✅ Checklist**

- ✅ Wrapped key is 256 bytes (RSA modulus) regardless of message length, RSA carries the key, Fernet carries the message.
- ✅ A payload up to ~16 KB survives; RSA never sees the payload.
- ✅ Simulating the "recipient", keep `session_key` a secret shared only between encryptor and unwrapper, produces `True` only when both halves use it.

**🤔 Socratic Question(s)**

- The demo generates the RSA pair *and* the session key in one script, one player wearing two hats. In a real handoff, who holds `private_key`, who ships `wrapped` (and how), and what does the *recipient* never see (the session key itself)?
- OAEP padding is mandatory-looking and easy to copy. What's the failure when a Java/TLS partner replaces OAEP with `PKCS1v15`, and why does "it's the same RSA" break the contract silently?

## Step 5: Sign and verify, prove it's yours, unmodified

Encryption proves secrecy; signatures prove *identity and integrity*: "who wrote this, and did it change on the way?" Signing uses your private key over the message's hash; verifying uses your public key and *fails loudly* if even one byte of the message differs. Two keys, two directions, one property each.

### 5.1 Sign a release note and catch the tamper

**👟 Starter hint:** `private_key.sign(message, padding.PSS(...), hashes.SHA256())`, then two `public_key.verify` calls, one against the pristine bytes, one against a one-second-later timestamp:

```python
# signverify.py
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

message = b"release v2.4 to production at 18:00 UTC"

private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()

signature = private_key.sign(
    message,
    padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH),
    hashes.SHA256(),
)
print("signature length (bytes):", len(signature))

def verify(m: bytes) -> bool:
    try:
        public_key.verify(
            signature, m,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                        salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256(),
        )
        return True
    except Exception:
        return False

print("verify(original):", verify(message))
print("verify(tampered):", verify(b"release v2.4 to production at 18:01 UTC"))
```

Run it:

```bash
uv run signverify.py
```

The `verify` helper wraps the raising `public_key.verify`, cryptography's convention is *raise nothing* on success and `InvalidSignature` on failure, so catching turns it into a boolean. `hashes.SHA256()` does double duty: PSS salts the hash and the signature covers only the digest, so signing a 2 GB file costs the same as signing this 45-byte note. The demo's lesson is the second line: the timestamp changed by one minute, the signature lives merrily unchanged, and verification says **no**, because verification is always against the *actual bytes in front of you*, not the message someone claimed to have sent.

**🎯 Expected output:**

```
signature length (bytes): 256
verify(original): True
verify(tampered): False (raised InvalidSignature)
```

**🩹 If it's off:** If `verify(original): False`, the `signature` was built from a *different* `message` object (a trailing newline or case change), sign and verify must hash the identical bytes. If `verify(tampered)` also returns `True`, the function you edited isn't the one being tested (a `bytes(...)` copy vs. the literal), or `verify` swallows the exception and returns `True` on `except`.

### 5.2 Verify the signature logic

**✅ Checklist**

- ✅ Untouched message verifies `True`; a one-byte difference verifies `False`.
- ✅ Different keys → `False`: signing key and verifying key must be the matching pair.
- ✅ The signature is 256 bytes for any message size (2048-bit RSA hashes the message's digest, not the message).

**🤔 Socratic Question(s)**

- Signing uses the *private* key, verifying the *public*, the mirror image of RSA encryption. Why does that swap make perfect sense for "I publish my key, everyone checks my releases" and make encrypted uploads to a server the same math with the directions flipped?
- A signature proves the bytes are unmodified *to whoever holds the public key*. What single human-scale failure (posting a private key to a repo, publishing the wrong public key) makes the whole scheme theater, and what's the "then do this instead" rule?

## ⚠️ Common pitfalls

- **Reusing one key for everything.** Fernet keys are cheap; salts are free. Re-deriving a key with a stale salt, or sharing the same key file across machines, is how one compromised file leaks every other.
- **Actually storing the key.** A `.enc` file beside `key.txt` in the same folder is encryption theater. The key belongs outside the ciphertext's tree, a separate volume, env var, or secret manager.
- **Binary mode or GTFO.** `open(dst, "w")` corrupts encrypted bytes via newline translation and UTF-8 assumptions. It's `"wb"` and `"rb"`, always.
- **Swapping padding silently.** OAEP vs PKCS1v15 look interchangeable and are not. Mismatched padding or hash between encrypt/decrypt (or sign/verify) fails at the worst moment: in production, against a partner's implementation.
- **Signing the narrative, not the bytes.** "The message I sent" vs. `message` in memory are different objects. Sign/verify the exact bytes transferred, or you're verifying a byte-string that changed two minutes ago.

## What you just built

Five primitives, each one a complete, working crypto tool: Fernet symmetric round-trip, password→key derivation with a salt, file encryption that restores byte-for-byte, RSA-wrapped session-key handoff, and private-key signing with loud failure on tampering. The through-line is architecture, not math: authenticate your ciphertext, salt every derivation, never store a key beside what it locks, wrap small key material in RSA while Fernet carries payloads, and always verify the bytes in front of you.

:::tip[Run a fuller version without any local setup]
[`examples/encryption-toolkit/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/encryption-toolkit) in the course repo has the complete scripts (symmetric, keys, file round-trip, hybrid, sign/verify) together. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- The hybrid handoff is an arm's-length keystore: generate a `key.json` per environment, hold the RSA private key separately, and decrypt a config the moment the app boots. That's a 40-line production v1 of the file the team asked for.
- Add **PEM persistence** from Step 4's pair: `private_bytes(PublishingFormat.PKCS8, NoEncryption())` and `public_bytes(...)` to `private.pem`/`public.pem`, then load them back with `load_pem_private_key`, the bridge from in-memory demo to files on disk.
- **Rotate the keystore**: re-encrypt `secret.txt` with a fresh Fernet key and a new salt, keep the old `.enc` until every reader is on the new key, and log the rotation. Rotation is the operation production security actually runs daily.
- For a genuinely secure vault, require the password *at runtime* (never hard-code it) and feed `derive_key` into Step 3's file functions, the two halves finally join.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓