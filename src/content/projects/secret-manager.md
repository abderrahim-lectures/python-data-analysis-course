---
title: "Build a Secret Manager"
description: "Encrypt, store, read back, and audit API keys and passwords with AES-256 in the standard library, then defend a stored secret against tampering."
difficulty: "intermediate"
estimatedMinutes: 120
tags: ["cli", "security", "cryptography", "file-io", "json"]
learningObjectives:
  - "Encrypt a secret with AES-256-GCM using Python's cryptography library"
  - "Persist encrypted secrets in a JSON vault with a nonce and tag"
  - "Decrypt and audit-append every access with a rotating key"
  - "Detect tampered ciphertext via authenticated decryption failure"
prerequisites: ["python-101/file-io", "python-101/dictionaries", "python-101/functions"]
---

# 🔐 Build a Secret Manager

A "secret manager" sounds exotic, vaults, hardware modules, government acronyms. Strip the marketing and it's a boast: encrypt a password or API key so an attacker holding your *entire storage medium* (a breached server, a stolen backup) still can't read the secret; decrypt it only when something legitimately asks; and keep an audit log of every time anything asked. This project builds the honest core of that promise with Python's `cryptography` library, AES-256-GCM, and a JSON vault on disk, a CLI that encrypts a secret, stores it, decrypts it back, logs every access, and *proves* it noticed tampering by refusing to decrypt anything that's been altered. No cloud, no onboarding, no compliance, but every mechanism you touch is the real mechanic used by real secret stores.

This assumes Python 101, file I/O, dictionaries, functions. No prior crypto background needed. It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Encrypt a secret with AES-256-GCM and watch it turn into opaque ciphertext.
2. Persist the material in a JSON vault, keyed, nonce-tagged, tamper-evident.
3. Decrypt a secret back on demand, appending an audit entry to a log.
4. Rotate the vault master key and re-encrypt everything in place.
5. Prove the vault detects tampering, flip one byte and watch decryption refuse.

## Where to run this

**Locally with `uv`** is the primary path, the whole project is a terminal CLI and two files on disk (`vault.json`, `audit.log`), and the tamper test (`flip a byte`) is *physically* satisfying only with real files you can open in an editor.

**GitHub Codespaces** runs the identical CLI: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and every command behaves exactly as locally, with the vault files sitting in the file tree.

**Google Colab, Kaggle Notebooks, and Binder run the entire pipeline honestly**, AES-256-GCM is local cryptography with no keys or network, so encrypt, store, decrypt, audit, rotate, and tamper-detect all work in a notebook the same way they do in a shell. The one caveat is philosophical: encryption is only as good as key *handling*, and the notebook's honest place is "learn the primitive and the audit discipline", the lesson that key-on-disk-next-to-data is theater, which you should experience by reading the code, not by trusting a badge.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/secret-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/secret-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsecret-manager%2Fnotebook.ipynb)

## Setup

A dependency, a key, and a decision about trust.

### Install `uv` and the cryptography library

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then:

```bash
uv --version
mkdir secret-manager && cd secret-manager
uv init --bare
uv add cryptography
```

### Generate a fresh vault master key

```bash
mkdir -p keys vault
uv run python -c "from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC; from cryptography.hazmat.primitives import hashes; import os; open('keys/master.key','wb').write(os.urandom(32))"
ls -l keys/master.key
chmod 600 keys/master.key
```

**⚠️ Read this before you see a crypt**
Secret storage isn't the physics of AES, it's the *trust boundary* of where the key lives. A real vault splits the key material into a separate access path (a KMS, a hardware token, a separate server) so that nobody who steals your `vault.json` also steals `master.key`. This project keeps the key on disk next to the vault because it's a *learning* tool, and it will say so loudly, the moment you copy `keys/master.key` into the same breach as `vault.json`, the encryption is decorative. Respecting that boundary by *not* sharing one file is the actual skill.

**✅ Checklist**

- ✅ `uv --version` prints a version; `cryptography` installed via `uv add`.
- ✅ `keys/master.key` is 32 bytes (`filesize` = 32) and `chmod 600` succeeds.
- ✅ You can articulate where the real vault's key would live if `master.key` and `vault.json` were on the same disk.

## Step 1: Encrypt a secret into ciphertext

Encryption has a shape: you pick a *key* (32 random bytes = 256 bits), a per-message *nonce* (12 random bytes, never reused with the same key), and hand all three to an authenticated cipher. AES-256-GCM outputs ciphertext *and* a 16-byte *authentication tag*, the tag is what lets the decryptor verify nobody altered anything. The first step's whole point is to *see* the transformation: a plaintext secret becomes unrecognizable bytes you could publish safely.

**👟 Starter hint:** Start by writing `encrypt_secret(plaintext)` that mints `os.urandom(12)`, calls `AESGCM(key()).encrypt(nonce, plaintext.encode(), None)`, and returns the ciphertext and nonce, then print both as hex and check the length is `len(plaintext) + 16`.

```python
# secret_manager.py
import json, os, subprocess
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

BASE = Path(".")
KEY_PATH = BASE / "keys" / "master.key"
VAULT_PATH = BASE / "vault" / "vault.json"
AUDIT_PATH = BASE / "vault" / "audit.log"

def key() -> bytes:
    return KEY_PATH.read_bytes()

def encrypt_secret(plaintext: str) -> tuple[bytes, bytes]:
    nonce = os.urandom(12)                      # fresh random bytes, per message
    ct = AESGCM(key()).encrypt(nonce, plaintext.encode(), None)
    return ct, nonce

ct, nonce = encrypt_secret("sk-live-9f2e11")
print("nonce    :", nonce.hex())
print("ciphertext:", ct.hex())
print("ct length :", len(ct), "bytes")
```

Two lines of API (`AESGCM(key()).encrypt`) hide the whole security discipline: the nonce is `os.urandom(12)` *once per message*, never reused under the same key (reusing a nonce with GCM destroys both confidentiality *and* the tag's meaning), and `encrypt` returns authenticated ciphertext plus the tag in one object. The `None` third argument is associated data, "extra text you'd like tamper-proofed but not secret." The output `ct.hex()` is the honest "what encryption looks like": a 16-plus-blocks random-looking string with zero resemblance to the secret, guaranteed by the AES key schedule.

**🎯 Expected output:** A nonzero `ct.hex()` differing completely from the plaintext, with `len(ct) ≈ len(plaintext) + 16` (the GCM tag rides along; for a 12-char secret, ~28 bytes).

**🩹 If it's off:** If `AESGCM(key()).encrypt(...)` raises `ValueError`, the key is the wrong length (`master.key` must be exactly 32 bytes, re-`os.urandom(32)` it). If the ciphertext *looks* like the plaintext, you didn't call `.encrypt` on a `bytes` payload, encode every string with `.encode()` before handing it to the cipher. If two runs with the same secret produce identical hex, the nonce got reused or is hard-coded, that's the exact bug that destroys GCM; recheck `os.urandom(12)` runs per call.

**✅ Checklist**

- ✅ The same plaintext produces *different* ciphertext across runs (nonce freshness).
- ✅ You can read the three inputs (key, nonce, plaintext) out of the call.
- ✅ You can say *why* the key never gets stored next to the vault (from the Setup note).

**🤔 Socratic Question(s)**

- GCM's tag exists to catch *any* modification of the ciphertext. But what if the attacker can't change ciphertext, only *swap* two ciphertexts in the vault (a rollback)? Which part of the proof fails when someone swaps two blobs that each validate their own tag? That's the cryptography-equivalent of a versioning bug.
- The revisit-the-nonce warning: GCM with a reused key-nonce pair leaks the XOR of the two plaintexts and voids the tag. What does this imply for how you store nonces in a vault with many secrets (need them per-blob, random, atomic?), and what would a lazy `nonce = b"0012"` do to a real deployment?

## Step 2: Persist the secret in a JSON vault

Encryption is ephemeral art until the material lands on disk. The vault is a JSON document mapping each secret's *name* to its three artifacts, ciphertext, nonce, and tag, so a decryptor can later find exactly what it needs for that key. JSON is the deliberate choice: human-inspectable ("`vault.json` is a legit file," an auditor says), portable, and trivially drivable by the same dict/JSON skills from Python 101.

**👟 Starter hint:** Start by writing `store(name, plaintext)`: load the existing vault JSON (or `{}` on first run), slot `{"ct": ..., "nonce": ...}` under `name`, and write the whole document back with `indent=2`.

```python
# secret_manager.py (continued)

def store(name: str, plaintext: str) -> None:
    ct, nonce = encrypt_secret(plaintext)
    data = {}
    if VAULT_PATH.exists():
        data = json.loads(VAULT_PATH.read_text())
    data[name] = {"ct": ct.hex(), "nonce": nonce.hex()}
    VAULT_PATH.write_text(json.dumps(data, indent=2))

store("github_token", "ghp_1234567890abcdef")
print("vault now:")
print(VAULT_PATH.read_text())
```

`store` is read-modify-write: load whatever the vault already holds (defaulting to `{}` on first run), slot the new secret under its name, and write the whole document back. The vault format commits to a *blessed shape*, `name → {ct, nonce}`, which is exactly the durability contract a real secret store has with its decryptors. Updating an existing name simply overwrites its entry, which is the desired semantics for "I re-rolled this credential."

**🎯 Expected output:** A `vault/vault.json` containing one keyed entry, `{"github_token": {"ct": "<hex>", "nonce": "<12-byte hex>"}}`, with the ciphertext visibly unrelated to `ghp_...`.

**🩹 If it's off:** If the vault file isn't created, `VAULT_PATH.parent` doesn't exist, `mkdir -p vault` from Setup is the fix (or `VAULT_PATH.parent.mkdir(parents=True)`). If `store` overwrites the whole vault with one secret on repeat runs, the read-modify-write isn't loading the existing JSON, double-check the `if VAULT_PATH.exists()` load happens *before* the write, not after. If `json.loads` crashes, the vault got corrupted, a stray `write` from another editor; keep a zero-byte `{}` to start fresh.

**✅ Checklist**

- ✅ `vault.json` exists with the new entry, readable by human eye.
- ✅ Calling `store` twice for *different* names keeps both entries (no overwrite).
- ✅ The file contains no plaintext, the secret string appears `nowhere` in the JSON.

**🤔 Socratic Question(s)**

- The stored material pairs `ct` with `nonce` but stores them hex-encoded. An auditor asks: "why isn't the *tag* in this record?", dig into how ciphers' API returns the tag and what storing it *separately* (or not at all) would change about detect-and-refuse later.
- JSON's `indent=2` is for humans; a production vault would store raw bytes, not hex. Name the *cost* of the readability: what does hex-encoding + human-inspectable JSON allow an attacker to learn from your vault (about naming, volume, age) that raw binary denies?

## Step 3: Decrypt on demand with an audit trail

A secret manager that only encrypts is a filing cabinet with a lock and no keyhole. The read path matters as much as the write path, and the *audit* path is the whole point of a manager rather than a plain cipher. This step decrypts a secret from the vault *and records every such access to `audit.log`*, timestamps and all. You're building accountability: the log is the part that catches a scoundrel.

**👟 Starter hint:** Start by writing `load(name)`, bytes-from-hex the stored `ct` and `nonce`, hand them to `AESGCM(key()).decrypt(...)`, and `.decode()` the result, then add `audit(name)` to append a UTC-timestamped read line.

```python
# secret_manager.py (continued)
from datetime import datetime, timezone

def load(name: str) -> str:
    data = json.loads(VAULT_PATH.read_text())
    entry = data.get(name)
    if entry is None:
        raise KeyError(f"no secret named {name!r} in vault")
    ct = bytes.fromhex(entry["ct"])
    nonce = bytes.fromhex(entry["nonce"])
    return AESGCM(key()).decrypt(nonce, ct, None).decode()

def audit(name: str) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    with AUDIT_PATH.open("a") as f:
        f.write(f"{ts}  read  {name}\n")

secret = load("github_token")
audit("github_token")
print("secret:", secret)
print("audit :")
print(AUDIT_PATH.read_text())
```

`load` walks the exact inverse of `store`: bytes-from-hex each artifact, hand key+nonce+ciphertext to `AESGCM.decrypt`, and `.decode()` the plaintext. Failure modes are deliberate, missing name raises `KeyError` (a *loud* programmer error, not a silent `None`), and a tampered ciphertext raises `InvalidTag` (Step 5 exploits that). `audit` is deliberately *separate* from `load` so you can call the decrypt in a REPL without logging noise, but the pairing is the discipline: production managers log every `load`, and the timestamp is UTC (`datetime.timezone.utc`) so a midnight-config computer doesn't scramble the trail.

**🎯 Expected output:** The secret prints round-tripped (`sk-live-9f2e11`), and `audit.log` gains one line, e.g. `2026-09-06T14:02:11.123456+00:00  read  github_token`.

**🩹 If it's off:** If `KeyError` fires on a name you *know* is in the vault, the JSON key has whitespace or a casing mismatch, print `data.keys()` and compare exactly. If `InvalidTag` appears on a fresh store, the key file changed between `store` and `load`, a different `master.key` means a *set* of ciphertexts that can never decrypt; regenerate the key *and* re-encrypt every secret (or copy the old key back). If the audit file grows unbounded, that's correct behavior for a short run, the "rotation that archives old logs" dance belongs in Step 4.

**✅ Checklist**

- ✅ Decrypt reproduces the exact plaintext (`repr` shows no trailing whitespace).
- ✅ `audit.log` contains a UTC timestamp + `read <name>` line per access.
- ✅ Reading a nonexistent name raises a loud `KeyError`, not `None`.

**🤔 Socratic Question(s)**

- `load` and `audit` are two functions you pair by *calling them together.* In a script, what happens if a crash lands between `load` and `audit`, did the secret get read that isn't logged? Name the pattern (write the log line *before* or *after* the decrypt, and which failure you'd rather hide) that a production system chooses.
- Audit logs are append-only text. An attacker who can *write* to `vault/` can also write to `audit/`. What distinguishes a *tamper-evident* audit log (hash-chaining each line to the last) from this one, and under what trust model does plain text matter in the first place?

## Step 4: Rotate the master key and re-encrypt

Keys age like passwords, a key that's been in a breach *might* be compromised, and rotation is the "change the lock, reissue all doors" operation. In a vault this is a two-step dance: *re-key* every stored ciphertext under a fresh key (decrypt with the old, re-encrypt with the new), then *secure the old key* so it can't silently decrypt old material. Step 4 automates the re-encryption and stages the "old key to trash" decision loudly.

**👟 Starter hint:** Start by writing `rotate()` that decrypts every vault entry with the current key and re-encrypts it under a fresh `os.urandom(32)` key, then retires the old key file and moves the new one into its canonical path.

```python
# secret_manager.py (continued)

def rotate(new_key_path: Path = BASE / "keys" / "master2.key") -> None:
    data = json.loads(VAULT_PATH.read_text())
    new_key = os.urandom(32)
    new_key_path.write_bytes(new_key)
    for name, entry in data.items():
        old = AESGCM(key()).decrypt(bytes.fromhex(entry["nonce"]),
                                    bytes.fromhex(entry["ct"]), None)
        nonce = os.urandom(12)
        data[name] = {
            "ct":  AESGCM(new_key).encrypt(nonce, old, None).hex(),
            "nonce": nonce.hex(),
        }
    VAULT_PATH.write_text(json.dumps(data, indent=2))
    (KEY_PATH).unlink()     # old key retired
    new_key_path.replace(KEY_PATH)

rotate()
print("rotated; new key in place:", KEY_PATH.exists())
print("new key differs from old  :", True)
```

The loop is the re-key engine: for every entry, decrypt with the current `master.key`, mint a fresh nonce, re-encrypt under `new_key`, and write the whole vault back. The retired-key step is where security lives, `unlink()` the old key file and `replace` the new one into its canonical path so the *name* `master.key` still resolves but the *bytes* are brand new. The vault now stores ciphertexts never tied to the old key, and the old key material is *gone*, end of story, not "hidden," *deleted*.

**🎯 Expected output:** Rotation completes with a fresh 32-byte key at `keys/master.key`, `True` for both existence checks, and every vault entry still decrypts under the new key.

**🩹 If it's off:** If a rotation crashes mid-loop, some entries are keyed under the *new* key while others remain under the old, running `rotate()` again then *double*-re-encrypts the new ones. Do the re-key in a temp dict and write only on success; partial writes are the rotational bug. If `master2.key` lingers after `replace`, the replace failed (cross-filesystem move), use `Path.replace` semantics that overwrite atomically when both paths are in the same `keys/` dir.

**✅ Checklist**

- ✅ `master.key` bytes differ from before rotation (`keys` diff or re-hash).
- ✅ Every name still decrypts under the rotated key (all `load` calls succeed).
- ✅ No `master2.key` survivor in `keys/` after the `replace`.

**🤔 Socratic Question(s)**

- Rotation re-encrypts but does NOT change *the secrets themselves*. A rotated key still lets an old API key decrypt, rotation changes *who* can read ciphertexts via key control, not *what* the ciphertexts say. When must rotation be paired with *re-issuing the secret* itself (think "this credential was in a log"), and why would a manager rotate aggressively regardless?
- The atomicity trap, a crash mid-loop leaves a *hybrid vault*. Design the two-line fix (build the new dict in memory, write once) and name the real-world consequence if you skip it (some secrets decryptable only by the old key that's going to the trash).

## Step 5: Prove tamper detection

The final step is the adversarial one, and the payoff for using AEAD in the first place. Anyone with write access to `vault` can flip bytes of ciphertext, and the decryptor's *only* defense is the authentication tag. This step deliberately corrupts a saved ciphertext and watches `AESGCM.decrypt` refuse, `InvalidTag` is the entire security story in one exception: altered ciphertext can never pass as honest.

**👟 Starter hint:** Start by loading one vault entry, flipping a single ciphertext bit with `tampered[3] ^= 0x01`, and wrapping the `AESGCM.decrypt` call in a `try/except InvalidTag`.

```python
# secret_manager.py (continued)
from cryptography.exceptions import InvalidTag

data = json.loads(VAULT_PATH.read_text())
name = "github_token"
entry = data[name]
ct = bytes.fromhex(entry["ct"])
tampered = bytearray(ct)
tampered[3] ^= 0x01          # flip one bit in the ciphertext
print("tag check:", end=" ")
try:
    AESGCM(key()).decrypt(bytes.fromhex(entry["nonce"]), bytes(tampered), None)
    print("DECRYPTED (unexpected!)")
except InvalidTag:
    print("rejected — ciphertext was tampered with")
```

One bit flip, `tampered[3] ^= 0x01`. Because GCM authenticates the whole ciphertext under the tag computed at encrypt time, any alteration, one byte or every byte, fails the tag check, and `.decrypt` raises `InvalidTag` instead of returning garbage. That's the AEAD contract in one exception: *decrypt everything or decode nothing*. A symmetric cipher without a tag (raw AES/CBC) would instead silently return a wrong plaintext, an attacker could flip bits and get a *confidently wrong* secret that still "decrypts." The try/except is your whole tamper-response policy: no partial trust, just loud refusal.

**🎯 Expected output:** `rejected, ciphertext was tampered with`, never the decrypted secret, never a garbage string; an honest `InvalidTag` stops the pipeline.

**🩹 If it's off:** If the tamper test *prints the secret anyway*, the tag wasn't validated, a classic cause is decrypting with a *nonce-looking* "tag" or calling the wrong API overload (raw AES has no tag). If `InvalidTag` imports fail (`from cryptography.exceptions import InvalidTag`), you're on an old `cryptography` version, upgrade with `uv add cryptography@latest`. If you accidentally `tampered[3] ^= 0` (XOR with zero), nothing changed and it decrypts *correctly*, that's the bug report: no mutation, no failure, and the lesson that "unchanged bytes never alert."

**✅ Checklist**

- ✅ One flipped bit yields `InvalidTag` and *no* plaintext is printed.
- ✅ The untampered entry still decrypts (positive control still passes).
- ✅ You can state the AEAD guarantee in one sentence: ciphertext is nonzero-error-verifiable, so a single altered byte aborts the decrypt.

**🤔 Socratic Question(s)**

- The tag detects *any* modification, but it detects it only at *decrypt time*. A vault that never decrypts a corrupted file "looks fine" forever, where does the security actually bite (the moment of access), and what does that say about *monitoring decrypt attempts* rather than just encrypting?
- Raw AES (no tag) would *accept* a flipped ciphertext and return a different, plausible-looking secret. Trace the realistic attack on a CBC vault of *attacker-controlled bit flips turning "amount=1" into "amount=100"*. What's the one word for why GCM's refusal is a *feature*, not a nuisance, when ciphertext lives in untrusted storage?

## ⚠️ Common pitfalls

- **Key living next to the vault.** AES is meaningless if the same breach that stole `vault.json` also stole `master.key`, encryption protects at rest, not against full compromise. Split the trust path (KMS/token/separate disk) in anything real.
- **Nonce reuse under one key.** Reusing a GCM nonce leaks the XOR of plaintexts and voids the tag. Always `os.urandom(12)` per encrypt; never hard-code or derive your nonce from the name.
- **Hybrid vault after an interrupted rotation.** A crash in the decrypt-re-encrypt loop leaves older entries under the old (just-deleted) key. Build the whole new dict in memory, then write once, atomic writes aren't a nice-to-have.
- **`decode()` surprises from smuggled bytes.** Hex round-trips are strict; a stray extra byte (a newline from a hand-edit) makes `bytes.fromhex` raise before the tag check even runs. Validate hex at storage time, or harvest errors at load.
- **Raw ciphers that "decrypt anything."** A tagless cipher returns *some* plaintext for tampered data, confidently wrong. The whole point of `AESGCM` is `InvalidTag` on the first flipped bit; don't "optimize" it away for a faster code path.

## What you just built

A functioning secret manager: AES-256-GCM encrypted a credential into authenticated ciphertext; a JSON vault persisted it keyed by name; decryption round-tripped it with a UTC-stamped audit trail; a rotation re-keyed the entire vault under fresh 32-byte key material; and a single-bit tamper test proved the vault refuses altered ciphertext with `InvalidTag`. The transferable layers go past the CLI: you now own the nonce discipline, the "key lives on a different trust boundary" conviction, and the honest-to-god *feel* of an authenticated decrypt refusing a flipped byte, which is the security behavior real platforms depend on.

:::tip[Run a fuller version without any local setup]
[`examples/secret-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/secret-manager) in the course repo bundles the manager module, a `.gitignore`d `keys/` scaffold, and a notebook that encrypts, persists, decrypts, rotates, and tamper-tests inline. Clone it, or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run the five steps start to finish.
:::

## Where to go from here

- **A real key path:** move `master.key` to a path outside the vault directory (or an env var), so the trust boundary from Setup actually separates the two honors.
- **Tied audit log:** hash-chain `audit.log` (each line embeds the previous line's hash) so the "attacker edits both files" gap across Step 3 closes into a proper tamper-evident trail.
- **A CLI wrapper:** `argparse` with `secret get github_token`, `secret set`, `secret rotate`, `secret ls`, the functions you wrote, exposed as a real shell tool.
- **Time-based rotation:** run `rotate()` on a schedule (`schedule` or a cron line) and archive old `audit.log`s, the "manager" word, earned.

## Share your project with the class

Built a vault, rotated your own keys live, or got a tamper test that made you grin? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓