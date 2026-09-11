---
title: "Boîte à Outils de Chiffrement"
description: "Chiffrez et déchiffrez les fichiers et messages avec AES-256, RSA et échange sécurisé de clés."
difficulty: "intermediate"
estimatedMinutes: 80
tags: ["cli", "cryptography", "files", "security"]
prerequisites:
  - "Les bases de Python (fonctions, fichiers, octets)"
  - "À l'aise pour éditer et exécuter des scripts dans le terminal"
learningObjectives:
  - "Chiffrer et déchiffrer un message avec une clé symétrique"
  - "Dériver une clé robuste d'un mot de passe avec PBKDF2 et un sel aléatoire"
  - "Chiffrer et déchiffrer des fichiers sur disque, en prouvant l'intégrité du round-trip"
  - "Envelopper une clé de session partagée avec des paires publiques/privées RSA"
  - "Signer un message et le vérifier contre une copie modifiée"
---

# 🔐 Construis une Boîte à Outils de Chiffrement

« Fichier de trousseau de clés. Construis-le. » — une vraie équipe a demandé exactement cela : un fichier Python qui verrouille les secrets de service au repos. Ce projet construit cette boîte à outils de zéro : un message en clair → un chiffré, un mot de passe transformé en vraie clé, un fichier qui fait un aller-retour à travers le chiffrement sans qu'un octet ne change, le RSA verrouillant une clé de session pour que deux côtés puissent partager un secret symétrique sans partager le secret lui-même, et une signature qui prouve qu'un message n'est pas modifié et a été envoyé par le détenteur d'une clé privée. À la fin, tu détiendras les cinq primitives que toute bibliothèque de sécurité embarque, utilisées correctement.

Ce projet suppose que tu maîtrises Python 101 — listes, dicts, fonctions, fichiers — plus une aisance avec les octets et `with open(...)`. La seule dépendance est `cryptography`, une bibliothèque de sécurité de premier rang (utilisée par pip, TLS et les outils de GitHub) qui n'a rien à envier à `openssl` à des fins d'apprentissage — chiffrement authentifié, dérivation de clés et RSA dans une seule API.

## 🎯 Ce que tu vas faire

1. Générer une clé Fernet et faire un aller-retour d'un message, en clair puis chiffré et retour.
2. Dériver une clé déterministe d'un mot de passe avec PBKDF2 + sel aléatoire — et voir un mauvais mot de passe produire du charabia que rien ne peut déverrouiller.
3. Chiffrer un fichier en `.enc` et le restaurer octet pour octet.
4. Envelopper une clé de session Fernet avec du RSA pour que la clé publique d'un destinataire la déverrouille, mais que seule sa clé privée puisse jamais la lire.
5. Signer un message avec ta clé privée et vérifier à la fois une copie intacte et une copie modifiée.

## Où exécuter ceci

**Localement avec `uv`** est le chemin recommandé — la dérivation de clés et le chiffrement de fichiers sont des outils CLI locaux, et `uv` gère proprement la dépendance `cryptography`.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal de navigateur.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent — le notebook à [`examples/encryption-toolkit/notebook.fr.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/encryption-toolkit/notebook.fr.ipynb) pré-installe `cryptography` et exécute chaque étape en mémoire.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/encryption-toolkit/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/encryption-toolkit/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fencryption-toolkit%2Fnotebook.fr.ipynb)

## Configuration

`uv` est un outil unique qui remplace la chaîne « installer Python, puis pip, puis un outil d'environnement virtuel » — et l'unique dépendance tierce, `cryptography`, s'installe en quelques secondes.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme l'installation :

```bash
uv --version
```

Puis configure le projet avec le paquet cryptography :

```bash
uv init encryption-toolkit
cd encryption-toolkit
uv add cryptography
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `uv add cryptography` se termine par « Prepared ... cryptography » dans le journal.
- ✅ `uv run python -c "from cryptography.fernet import Fernet"` réussit.

## Étape 1 : Faire un aller-retour symétrique avec une clé Fernet

Le chiffrement est une porte : la *clé* l'ouvre, le *chiffré* est ce que la porte dissimule. Fernet est le « défaut raisonnable » de `cryptography` — AES-128-CBC plus un MAC, encodé en base64, un objet dont `encrypt` et `decrypt` font tout le travail. L'invariant d'aller-retour — `decrypt(encrypt(x)) == x` — est la propriété sur laquelle s'appuie chaque étape ultérieure, alors ta toute première démo le prouve.

### 1.1 Fais passer Fernet à l'épreuve

**👟 Indice de départ :** `Fernet.generate_key()` fabrique une clé toute neuve ; le même objet `Fernet(key)` chiffre et déchiffre :

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

Exécute-le :

```bash
uv run symmetric.py
```

`key` et `token` sont du texte base64 sûr pour les URL que tu pourrais glisser dans une config YAML ou une ligne de journal — ils *paraissent* présentables et sont exactement aussi dérangés : `key` est les 32 octets aléatoires dont Fernet a besoin, `token` est le chiffré plus un MAC plus un horodatage, et ni l'un ni l'autre ne ressemble au message d'une manière humaine quelconque. `decrypt` vérifie aussi l'intégrité : un jeton muté lève `InvalidToken` au lieu de renvoyer du charabia — le MAC rend la détection de contrefaçon gratuite à chaque lecture.

**🎯 Résultat attendu :** (les octets `key`/`token` diffèrent sur ta machine — aléatoire frais à chaque exécution)

```
key: mlELRCZYDLnXiLKv6S3s0stB92jE_qVhxx6-R3AycKk=
token: gAAAAABqndOYC911dXqRml78PYZngKgnwQTQbqes0eTFGn7fd7H7ZbVrplSQ406cDYBvxK2D6yG64eKtpOy5Cni5n5i2C1bgjWzSdpCrM9vC9c_W7A7WfN4=
round-trip ok: True
key bytes: 44
token bytes: 120
```

**🩹 Si ça ne marche pas :** Si `round-trip ok: False`, l'une des deux opérations n'utilise pas la même clé — vérifie qu'aucun second `Fernet(...)` ne construit une clé toute neuve. Si `decrypt` lève `InvalidToken`, le `token` a été écrit après `encrypt` (un éditeur d'images qui enlève un `=` final casse le base64), ou tu as déchiffré un jeton d'une exécution *précédente* avec une clé *nouvelle* — la porte a besoin de la même clé qui l'a verrouillée.

### 1.2 Vérifie l'aller-retour

**✅ Liste de vérification**

- ✅ `key` fait 44 caractères (32 octets, base64) et `token` 120 caractères pour un message de 25 octets.
- ✅ `plain == message` — le déchiffrement renvoie exactement les octets d'origine.
- ✅ Corrompre un caractère de `token` (changer `A` en `B`) fait lever `InvalidToken` à `decrypt`, pas renvoyer un texte erroné.

**🤔 Question(s) socratique(s)**

- La clé est stockée — où ? Si ce script écrit `key` dans un fichier à côté du chiffré, la serrure est décorative : un attaquant lit les deux. Quelle règle minimale de stockage rend la clé réellement secrète (fichier séparé, variable d'environnement, gestionnaire de secrets) ?
- Fernet est un chiffrement *authentifié* : le déchiffrement d'un jeton modifié échoue bruyamment. Pourquoi ce seul comportement importe-t-il plus pour des « fichiers de config au repos » que pour une démo jouet — quel bug de l'alternative silencieuse empêche-t-il ?

## Étape 2 : Dériver une clé d'un mot de passe

Personne ne retient 32 octets aléatoires ; tout le monde retient un mot de passe. PBKDF2 étire un mot de passe faible en une clé robuste — *et* un hash, donc `"correct-horse-battery-staple"` + le même sel produit toujours la même clé de 32 octets, tandis que `"correct-horse-battery-staple"` + un sel différent produit quelque chose de sans rapport. Le sel est l'aide-mémoire : stocké à côté du hash, jamais secret, il rattache chaque dérivation aux clés de ce seul utilisateur.

### 2.1 Dérive avec PBKDF2

**👟 Indice de départ :** `PBKDF2HMAC(hashes.SHA256(), length=32, salt=..., iterations=600_000).derive(password)` — le même sel, la même dérivation, la même clé :

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

Exécute-le :

```bash
uv run keys.py
```

La fonction est délibérée dans ce qu'elle omet : elle prend un *mot de passe* et un *sel* et renvoie exactement `length` octets — pas de persistance, pas d'écriture de fichiers, donc l'appelant décide quoi stocker. `iterations=600_000` de PBKDF2 est le « ralentisseur » : chaque dérivation fait 600 000 tours de HMAC-SHA256, donc la force brute d'un mot de passe coûte à l'attaquant six cent mille fois plus qu'à toi. Les sels `os.urandom(16)` ne se répètent jamais en pratique, tuant les tables arc-en-ciel — et le prix de la répétition d'un sel est l'effondrement de toutes les clés dérivées en une seule.

**🎯 Résultat attendu :**

```
same password + salt -> same key: True
wrong password -> different key: True
key bytes: 32
salt bytes: 16
```

**🩹 Si ça ne marche pas :** Si `same password + salt -> same key: False`, l'appel `derive` a attrapé une copie de `salt` modifiée entre les appels (`os.urandom` dans la fonction ferait aussi cela — le sel doit être une valeur transmise). Si `iterations` manque, bienvenue dans le monde des alarmes de clé faible : la démo passe toujours, mais le coût de force brute de la clé vient de baisser de six ordres de grandeur.

### 2.2 Vérifie la dérivation

**✅ Liste de vérification**

- ✅ La même paire `(password, salt)` produit des clés identiques octet par octet en deux appels séparés.
- ✅ Un mot de passe faux d'un seul mot produit une clé différente de 32 octets même avec le même sel.
- ✅ Un nouveau sel `os.urandom(16)` avec le même mot de passe casse la clé précédente — les sels rattachent les clés.

**🤔 Question(s) socratique(s)**

- Le sel n'est *pas* un secret, pourtant le supprimer affaiblit le système. Contre quoi le sel protège-t-il exactement — et pourquoi la réutilisation d'un seul sel pour tous les utilisateurs est-elle l'équivalent du bourrage d'identifiants ?
- `600_000` itérations est un nombre issu d'un benchmark, pas une loi. Qu'est-ce qui le pousse vers le haut sur un vrai serveur (gains de CPU, machines de craquage GPU), et quel est le coût d'en choisir une valeur trop élevée (chaque démarrage d'app, chaque connexion) ?

## Étape 3 : Chiffrer et déchiffrer des fichiers

Maintenant la boîte à outils devient pratique : chiffre `secret.txt` en `secret.txt.enc`, puis restaure-le en `restored.txt`. L'aller-retour est *tout le contrat* — texte en clair en entrée, chiffré sur disque, texte en clair restitué octet pour octet — et la victoire « le chiffré dissimule le texte en clair » est ce qu'un sceptique vient vérifier en ouvrant le fichier `.enc`.

### 3.1 Écris le chiffreur de fichiers

**👟 Indice de départ :** Les fonctions de service prennent `src/dst/key` et renvoient des tailles ; la démo les pilote avec un texte en clair de 32 octets et une clé Fernet :

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

Exécute-le :

```bash
uv run encrypt_file.py
```

Deux fonctions en miroir (encrypt lit le texte, écrit le chiffré ; decrypt lit le chiffré, écrit le texte) rendent le pipeline lisible de gauche à droite avant même de l'exécuter. `Path.write_bytes`/`read_bytes` cachent le passe-partout `with` et gardent la démo courte ; les vrais fichiers vivent sur disque, donc *tu* peux `cat secret.txt.enc` ensuite et confirmer qu'aucune trace lisible ne survit. Le chiffré fait 140 octets contre 32 en clair — le MAC de Fernet plus son bloc de version — la taxe que tu paies pour le chiffrement authentifié, et elle en vaut entièrement la peine.

**🎯 Résultat attendu :**

```
plaintext size:   32 bytes
ciphertext size:  140 bytes
restored matches: True
ciphertext hides plaintext: True
```

**🩹 Si ça ne marche pas :** Si `restored matches: False`, le `src` du decrypt pointait vers le fichier *original* (sans `.enc`) ou la clé diffère entre les deux appels — déchiffre le chiffré avec la même clé qui l'a produit. Si les tailles reviennent à `0`, le script a écrit des octets dans `secret.txt.enc` via `open(dst, "w")` (mode texte) — le chiffrement a besoin de `"wb"`/`"rb"`, le mode binaire dans les deux sens.

### 3.2 Vérifie l'aller-retour de fichiers

**✅ Liste de vérification**

- ✅ `secret.txt.enc` existe, fait 108 octets de plus que la source, et `cat` ne montre que du charabia base64.
- ✅ `restored.txt` est identique octet par octet à `secret.txt` (la vérification `==`, pas un coup d'œil).
- ✅ Supprimer `restored.txt` et relancer seulement `decrypt_file` le reproduit — lectures idempotentes.

**🤔 Question(s) socratique(s)**

- `encrypt_file` zippe tout le fichier dans un seul jeton Fernet — parfait pour une note de 32 octets. Pour une sauvegarde de 2 Go, un jeton unique signifie qu'une seule défaillance de MAC tue tout le fichier sans rien déchiffrer. Quelle est la forme opérationnelle d'un chiffreur *streaming*, et pourquoi un vrai outil pourrait-il quand même choisir le fichier entier pour des charges utiles de taille config ?
- L'extension `.enc` et le nommage « ciphertext » est une convention, pas une garantie. Où dans cette boîte à outils prouverais-tu (au lieu de l'impliquer) qu'un partenaire déchiffrant a la bonne clé — avant qu'il fasse confiance aux octets « restaurés » ?

## Étape 4 : Envelopper une clé de session avec du RSA (chiffrement hybride)

RSA chiffre au plus ~245 octets d'une clé de 2048 bits — inutile pour un fichier de 2 Go, idéal pour la *clé de session* que le Fernet de ton fichier utilise. C'est le chiffrement hybride, l'architecture derrière TLS : chiffre la charge utile avec du Fernet symétrique rapide, enveloppe la petite clé symétrique avec du RSA lent mais partageable, et ne transfère que la clé enveloppée. La clé *publique* du destinataire chiffre ; seule sa clé *privée* déchiffre.

### 4.1 Chiffre une charge utile, enveloppe la clé

**👟 Indice de départ :** Génère une paire RSA, chiffre le message avec une clé Fernet toute neuve, puis `public_key.encrypt(session_key, padding.OAEP(...))` — et désenveloppe côté privé :

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

Exécute-le :

```bash
uv run hybrid.py
```

Chaque côté de la passation fait exactement une tâche : `public_key.encrypt` enveloppe la *clé* (RSA 2048 bits, donc la clé de session ~32 octets rentre avec le rembourrage OAEP — c'est pourquoi la longueur enveloppée est 256, la taille du module RSA). La *charge utile* reste sur Fernet, c'est pourquoi le texte du message ne touche jamais RSA du tout. Déchiffrer signifie reconstruire la clé de session d'abord — `unwrapped` retourne directement dans `Fernet(...)` et l'aller-retour se referme. Il n'y a aucun moyen de lire le message avec la seule clé privée ou la seule clé de session ; la cryptographie est un ET, et ce code le rend visible.

**🎯 Résultat attendu :**

```
RSA key size (bits): 2048
wrapped key length (bytes): 256
hybrid round-trip ok: True
```

**🩹 Si ça ne marche pas :** Si `public_key.encrypt` lève `ValueError: too large`, ta `session_key` a dépassé la capacité OAEP de ~245 octets — c'est attendu pour de vraies charges utiles et exactement pourquoi le schéma est hybride (Fernet porte le message, RSA seulement la clé). Si le déchiffrement échoue avec un rembourrage d'aspect identique, la combinaison `MGF1`/`algorithm` d'un côté diffère — les paramètres de rembourrage doivent correspondre précisément entre encrypt et decrypt.

### 4.2 Vérifie la passation hybride

**✅ Liste de vérification**

- ✅ La clé enveloppée fait 256 octets (module RSA) quelle que soit la longueur du message — RSA porte la clé, Fernet porte le message.
- ✅ Une charge utile jusqu'à ~16 Ko survit ; RSA ne voit jamais la charge utile.
- ✅ En simulant le « destinataire » — garde `session_key` un secret partagé uniquement entre le chiffreur et le désenveloppeur — `True` ne sort que lorsque les deux moitiés l'utilisent.

**🤔 Question(s) socratique(s)**

- La démo génère la paire RSA *et* la clé de session dans un seul script — un joueur portant deux casquettes. Dans une vraie passation, qui détient `private_key`, qui expédie `wrapped` (et comment), et que ne voit *jamais* le destinataire (la clé de session elle-même) ?
- Le rembourrage OAEP a l'air obligatoire et est facile à copier. Quelle est la défaillance quand un partenaire Java/TLS remplace OAEP par `PKCS1v15` — et pourquoi « c'est le même RSA » casse-t-il le contrat silencieusement ?

## Étape 5 : Signer et vérifier — prouve que c'est à toi, non modifié

Le chiffrement prouve le secret ; les signatures prouvent *l'identité et l'intégrité* : « qui a écrit ça, et ça a-t-il changé en route ? » Signer utilise ta clé privée sur le hash du message ; vérifier utilise ta clé publique et *échoue bruyamment* si ne serait-ce qu'un octet du message diffère. Deux clés, deux directions, une propriété chacune.

### 5.1 Signe une note de version et attrape la falsification

**👟 Indice de départ :** `private_key.sign(message, padding.PSS(...), hashes.SHA256())`, puis deux appels `public_key.verify` — un contre les octets intacts, un contre un horodatage d'une seconde plus tard :

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

Exécute-le :

```bash
uv run signverify.py
```

L'aide `verify` enveloppe le `public_key.verify` qui lève des exceptions — la convention de `cryptography` est *ne rien lever* en cas de succès et `InvalidSignature` en cas d'échec, donc attraper la transforme en booléen. `hashes.SHA256()` fait double service : PSS sale le hash et la signature ne couvre que le condensé, donc signer un fichier de 2 Go coûte la même chose que signer cette note de 45 octets. La leçon de la démo est la deuxième ligne : l'horodatage a changé d'une minute, la signature vit heureuse et inchangée, et la vérification dit **non** — car la vérification est toujours contre *les octets réellement devant toi*, pas le message que quelqu'un prétend avoir envoyé.

**🎯 Résultat attendu :**

```
signature length (bytes): 256
verify(original): True
verify(tampered): False (raised InvalidSignature)
```

**🩹 Si ça ne marche pas :** Si `verify(original): False`, la `signature` a été construite à partir d'un objet `message` *différent* (un saut de ligne final ou un changement de casse) — signer et vérifier doivent hasher les octets identiques. Si `verify(tampered)` renvoie aussi `True`, la fonction que tu as modifiée n'est pas celle testée (une copie `bytes(...)` contre le littéral), ou `verify` avale l'exception et renvoie `True` sur `except`.

### 5.2 Vérifie la logique de signature

**✅ Liste de vérification**

- ✅ Le message intact vérifie `True` ; une différence d'un octet vérifie `False`.
- ✅ Des clés différentes → `False` : la clé de signature et la clé de vérification doivent être la paire assortie.
- ✅ La signature fait 256 octets pour n'importe quelle taille de message (RSA 2048 bits hashe le condensé du message, pas le message).

**🤔 Question(s) socratique(s)**

- Signer utilise la clé *privée*, vérifier la *publique* — l'image miroir du chiffrement RSA. Pourquoi ce basculement a-t-il parfaitement du sens pour « je publie ma clé, tout le monde vérifie mes versions » et fait des envois chiffrés vers un serveur le même calcul avec les directions inversées ?
- Une signature prouve que les octets ne sont pas modifiés *pour quiconque détient la clé publique*. Quelle seule défaillance à échelle humaine (publier une clé privée dans un dépôt, publier la mauvaise clé publique) rend tout le schéma théâtral — et quelle est la règle « alors fais ceci à la place » ?

## ⚠️ Pièges courants

- **Réutiliser une clé pour tout.** Les clés Fernet sont bon marché ; les sels sont gratuits. Re-dériver une clé avec un sel périmé, ou partager le même fichier de clé entre machines, c'est ainsi qu'un fichier compromis en fuite tous les autres.
- **Stocker réellement la clé.** Un fichier `.enc` à côté de `key.txt` dans le même dossier, c'est du théâtre de chiffrement. La clé appartient hors de l'arborescence du chiffré — un volume séparé, une variable d'env, ou un gestionnaire de secrets.
- **Le mode binaire ou rien.** `open(dst, "w")` corrompt les octets chiffrés via la traduction des sauts de ligne et les hypothèses UTF-8. C'est `"wb"` et `"rb"`, toujours.
- **Échanger le rembourrage en silence.** OAEP et PKCS1v15 se ressemblent et ne sont pas interchangeables. Un rembourrage ou un hash désassorti entre encrypt/decrypt (ou sign/verify) échoue au pire moment : en production, contre l'implémentation d'un partenaire.
- **Signer le récit, pas les octets.** « Le message que j'ai envoyé » contre `message` en mémoire sont des objets différents. Signe/vérifie les octets exacts transférés, ou tu vérifies une chaîne d'octets qui a changé il y a deux minutes.

## Ce que tu viens de construire

Cinq primitives, chacune un outil crypto complet et fonctionnel : aller-retour symétrique Fernet, dérivation mot de passe→clé avec un sel, chiffrement de fichiers qui restaure octet pour octet, passation de clé de session enveloppée en RSA, et signature par clé privée avec échec bruyant sur falsification. Le fil conducteur est l'architecture, pas les maths : authentifie ton chiffré, sale chaque dérivation, ne stocke jamais une clé à côté de ce qu'elle verrouille, enveloppe le petit matériel de clé en RSA pendant que Fernet porte les charges utiles, et vérifie toujours les octets devant toi.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/encryption-toolkit/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/encryption-toolkit) dans le dépôt du cours contient les scripts complets (symétrique, clés, aller-retour de fichiers, hybride, signe/vérifie) ensemble. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller ensuite

- La passation hybride est un trousseau de clés à bout de bras : génère un `key.json` par environnement, garde la clé privée RSA séparément, et déchiffre une config au démarrage de l'app. C'est une v1 de production de 40 lignes du fichier que l'équipe a demandé.
- Ajoute la **persistance PEM** de la paire de l'étape 4 : `private_bytes(PublishingFormat.PKCS8, NoEncryption())` et `public_bytes(...)` vers `private.pem`/`public.pem`, puis recharge-les avec `load_pem_private_key` — le pont de la démo en mémoire aux fichiers sur disque.
- **Fais tourner le trousseau de clés** : rechiffre `secret.txt` avec une clé Fernet toute neuve et un nouveau sel, garde l'ancien `.enc` jusqu'à ce que chaque lecteur soit sur la nouvelle clé, et journalise la rotation. La rotation est l'opération que la sécurité de production exécute réellement chaque jour.
- Pour un coffre réellement sûr, exige le mot de passe *à l'exécution* (ne le code jamais en dur) et alimente `derive_key` dans les fonctions de fichiers de l'étape 3 — les deux moitiés se rejoignent enfin.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓