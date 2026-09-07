---
title: "Gestionnaire de Secrets"
description: "Chiffre, stocke, relit et audite des clés API et mots de passe avec AES-256 dans la bibliothèque standard — puis défends un secret stocké contre la falsification."
difficulty: "intermediate"
estimatedMinutes: 120
tags: ["cli", "security", "cryptography", "file-io", "json"]
learningObjectives:
  - "Chiffrer un secret avec AES-256-GCM en utilisant la bibliothèque cryptography de Python"
  - "Persister des secrets chiffrés dans un coffre JSON avec un nonce et une étiquette"
  - "Déchiffrer et ajouter à l'audit chaque accès avec une clé rotative"
  - "Détecter un texte chiffré falsifié via un échec de déchiffrement authentifié"
prerequisites: ["python-101/file-io", "python-101/dictionaries", "python-101/functions"]
---

# 🔐 Construire un Gestionnaire de Secrets

Un « gestionnaire de secrets » semble exotique — coffres, modules matériels, acronymes gouvernementaux. Retire le marketing et c'est une promesse : chiffrer un mot de passe ou une clé API pour qu'un attaquant tenant *tout ton support de stockage* (un serveur compromis, une sauvegarde volée) ne puisse toujours pas lire le secret ; le déchiffrer seulement quand quelque chose le demande légitimement ; et garder un journal d'audit de chaque fois que quoi que ce soit l'a demandé. Ce projet construit le cœur honnête de cette promesse avec la bibliothèque `cryptography` de Python, AES-256-GCM et un coffre JSON sur disque — un CLI qui chiffre un secret, le stocke, le déchiffre, journalise chaque accès et *prouve* qu'il a remarqué la falsification en refusant de déchiffrer tout ce qui a été altéré. Pas de cloud, pas d'inscription, pas de conformité — mais chaque mécanisme que tu touches est le vrai mécanisme utilisé par les vrais stores de secrets.

Cela suppose le Python 101 — entrées-sorties de fichiers, dictionnaires, fonctions. Aucune expérience en crypto requise. C'est optionnel et non noté ; vois [Projets du monde réel](/docs/projects) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Chiffrer un secret avec AES-256-GCM et le regarder se transformer en texte chiffré opaque.
2. Persister la matière dans un coffre JSON — indexé, avec nonce et étiquette, à l'épreuve de la falsification.
3. Déchiffrer un secret à la demande, en ajoutant une entrée d'audit à un journal.
4. Faire tourner la clé maîtresse du coffre et rechiffrer tout en place.
5. Prouver que le coffre détecte la falsification — retourne un octet et regarde le déchiffrement refuser.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal — tout le projet est un CLI terminal et deux fichiers sur disque (`vault.json`, `audit.log`), et le test de falsification (retourner un octet) n'est *physiquement* satisfaisant qu'avec de vrais fichiers que tu peux ouvrir dans un éditeur.

**GitHub Codespaces** exécute le CLI identique : ouvre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) et chaque commande se comporte exactement comme en local, avec les fichiers du coffre assis dans l'arborescence.

**Google Colab, les Notebooks Kaggle et Binder exécutent tout le pipeline honnêtement** — AES-256-GCM est de la cryptographie locale sans clés ni réseau, donc chiffrer, stocker, déchiffrer, auditer, faire tourner la clé et détecter la falsification fonctionnent tous dans un notebook exactement comme dans un shell. La seule réserve est philosophique : le chiffrement ne vaut que ce que vaut la *gestion* des clés, et la place honnête du notebook est « apprends la primitive et la discipline d'audit » — la leçon que la clé-sur-disque-à-côté-des-données est du théâtre, que tu dois vivre en lisant le code, pas en faisant confiance à un badge.

[![Ouvrir dans Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/secret-manager/notebook.ipynb)
[![Ouvrir dans Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/secret-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsecret-manager%2Fnotebook.ipynb)

## Configuration

Une dépendance, une clé, et une décision à propos de la confiance.

### Installe `uv` et la bibliothèque cryptography

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis :

```bash
uv --version
mkdir secret-manager && cd secret-manager
uv init --bare
uv add cryptography
```

### Génère une nouvelle clé maîtresse du coffre

```bash
mkdir -p keys vault
uv run python -c "from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC; from cryptography.hazmat.primitives import hashes; import os; open('keys/master.key','wb').write(os.urandom(32))"
ls -l keys/master.key
chmod 600 keys/master.key
```

**⚠️ Lis ceci avant de voir un chiffrement**
Le stockage de secrets n'est pas la physique d'AES — c'est la *frontière de confiance* de l'endroit où vit la clé. Un vrai coffre répartit la matière de la clé dans un chemin d'accès séparé (un KMS, un jeton matériel, un serveur distinct) pour que personne qui vole ton `vault.json` ne vole aussi `master.key`. Ce projet garde la clé sur disque à côté du coffre parce que c'est un outil *d'apprentissage*, et il le dira haut et fort — dès l'instant où tu copies `keys/master.key` dans la même brèche que `vault.json`, le chiffrement devient décoratif. Respecter cette frontière en *ne partageant pas* un seul fichier est la vraie compétence.

**✅ Liste de vérification**

- ✅ `uv --version` affiche une version ; `cryptography` installée via `uv add`.
- ✅ `keys/master.key` fait 32 octets (`filesize` = 32) et `chmod 600` réussit.
- ✅ Tu peux articuler où vivrait la clé d'un vrai coffre si `master.key` et `vault.json` étaient sur le même disque.

## Étape 1 : Chiffre un secret en texte chiffré

Le chiffrement a une forme : tu choisis une *clé* (32 octets aléatoires = 256 bits), un *nonce* par message (12 octets aléatoires, jamais réutilisés avec la même clé), et tu remets les trois à un chiffrement authentifié. AES-256-GCM produit du texte chiffré *et* une *étiquette d'authentification* de 16 octets — l'étiquette est ce qui permet au déchiffreur de vérifier que personne n'a rien altéré. Le but de la première étape est de *voir* la transformation : un secret en clair devient des octets méconnaissables que tu pourrais publier en toute sécurité.

**👟 Indice de départ :** Commence par écrire `encrypt_secret(plaintext)` qui fabrique `os.urandom(12)`, appelle `AESGCM(key()).encrypt(nonce, plaintext.encode(), None)`, et retourne le texte chiffré et le nonce — puis imprime les deux en hex et vérifie que la longueur est `len(plaintext) + 16`.

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

Deux lignes d'API (`AESGCM(key()).encrypt`) cachent toute la discipline de sécurité : le nonce est `os.urandom(12)` *une fois par message*, jamais réutilisé sous la même clé (réutiliser un nonce avec GCM détruit à la fois la confidentialité *et* la signification de l'étiquette), et `encrypt` retourne le texte chiffré authentifié plus l'étiquette dans un seul objet. Le troisième argument `None` est la donnée associée — « du texte supplémentaire que tu aimerais protéger contre la falsification mais qui n'est pas secret ». La sortie `ct.hex()` est l'image honnête de « à quoi ressemble le chiffrement » : une chaîne à l'apparence aléatoire de 16-plus-blocs sans aucune ressemblance avec le secret, garantie par le calendrier de clés AES.

**🎯 Résultat attendu :** Un `ct.hex()` non nul totalement différent du texte en clair, avec `len(ct) ≈ len(plaintext) + 16` (l'étiquette GCM suit le mouvement ; pour un secret de 12 caractères, ~28 octets).

**🩹 Si ça ne marche pas :** Si `AESGCM(key()).encrypt(...)` lève une `ValueError`, la clé a la mauvaise longueur (`master.key` doit faire exactement 32 octets — refais `os.urandom(32)`). Si le texte chiffré *ressemble* au texte en clair, tu n'as pas appelé `.encrypt` sur une charge utile `bytes` — encode chaque chaîne avec `.encode()` avant de la remettre au chiffrement. Si deux exécutions avec le même secret produisent le même hex, le nonce a été réutilisé ou est codé en dur — c'est exactement le bug qui détruit GCM ; revérifie que `os.urandom(12)` s'exécute à chaque appel.

**✅ Liste de vérification**

- ✅ Le même texte en clair produit un texte chiffré *différent* entre les exécutions (fraîcheur du nonce).
- ✅ Tu peux lire les trois entrées (clé, nonce, texte en clair) dans l'appel.
- ✅ Tu peux dire *pourquoi* la clé n'est jamais stockée à côté du coffre (d'après la note de Configuration).

**🤔 Question(s) socratique(s)**

- L'étiquette GCM existe pour attraper *toute* modification du texte chiffré. Mais que se passe-t-il si l'attaquant ne peut pas changer le texte chiffré, seulement *échanger* deux textes chiffrés dans le coffre (une relecture) ? Quelle partie de la preuve échoue quand quelqu'un échange deux blobs qui valident chacun leur propre étiquette ? C'est l'équivalent crypto d'un bug de versionnage.
- L'avertissement sur le nonce revisité : GCM avec une paire clé-nonce réutilisée fuit le XOR des deux textes en clair et invalide l'étiquette. Qu'est-ce que cela implique pour la façon dont tu stockes les nonces dans un coffre avec beaucoup de secrets (besoin par-blob, aléatoires, atomiques ?) — et que ferait un `nonce = b"0012"` paresseux à un vrai déploiement ?

## Étape 2 : Persiste le secret dans un coffre JSON

Le chiffrement est un art éphémère tant que la matière n'atterrit pas sur disque. Le coffre est un document JSON mappant le *nom* de chaque secret à ses trois artefacts — texte chiffré, nonce et étiquette — pour qu'un déchiffreur puisse ensuite trouver exactement ce dont il a besoin pour cette clé. JSON est le choix délibéré : inspectable par l'humain (« `vault.json` est un fichier légitime », dit un auditeur), portable, et pilotable trivialement par les mêmes compétences dict/JSON du Python 101.

**👟 Indice de départ :** Commence par écrire `store(name, plaintext)` : charge le JSON du coffre existant (ou `{}` à la première exécution), insère `{"ct": ..., "nonce": ...}` sous `name`, et réécris tout le document avec `indent=2`.

```python
# secret_manager.py (suite)

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

`store` est lecture-modification-écriture : charge ce que le coffre détient déjà (par défaut `{}` à la première exécution), insère le nouveau secret sous son nom, et réécrit tout le document. Le format du coffre s'engage sur une *forme bénie* — `nom → {ct, nonce}` — qui est exactement le contrat de durabilité qu'un vrai store de secrets a avec ses déchiffreurs. Mettre à jour un nom existant écrase simplement son entrée, ce qui est la sémantique souhaitée pour « j'ai régénéré cet identifiant ».

**🎯 Résultat attendu :** Un `vault/vault.json` contenant une unique entrée indexée — `{"github_token": {"ct": "<hex>", "nonce": "<hex de 12 octets>"}}` — avec le texte chiffré visiblement sans rapport avec `ghp_...`.

**🩹 Si ça ne marche pas :** Si le fichier du coffre n'est pas créé, `VAULT_PATH.parent` n'existe pas — `mkdir -p vault` de la Configuration est le correctif (ou `VAULT_PATH.parent.mkdir(parents=True)`). Si `store` écrase tout le coffre avec un seul secret aux exécutions répétées, la lecture-modification-écriture ne charge pas le JSON existant — revérifie que le chargement `if VAULT_PATH.exists()` a lieu *avant* l'écriture, pas après. Si `json.loads` plante, le coffre a été corrompu — une `write` vagabonde d'un autre éditeur ; garde un `{}` zéro octet pour repartir de frais.

**✅ Liste de vérification**

- ✅ `vault.json` existe avec la nouvelle entrée, lisible à l'œil humain.
- ✅ Appeler `store` deux fois pour des noms *différents* garde les deux entrées (pas d'écrasement).
- ✅ Le fichier ne contient aucun texte en clair — la chaîne du secret n'apparaît *nulle part* dans le JSON.

**🤔 Question(s) socratique(s)**

- La matière stockée associe `ct` à `nonce` mais les stocke encodés en hex. Un auditeur demande : « pourquoi l'*étiquette* n'est-elle pas dans cet enregistrement ? » — creuse comment l'API des chiffrements retourne l'étiquette et ce que la stocker *séparément* (ou pas du tout) changerait pour détecter-et-refuser plus tard.
- L'`indent=2` de JSON est pour les humains ; un coffre de production stockerait des octets bruts, pas de l'hex. Nomme le *coût* de la lisibilité : que permet l'encodage hex + un JSON inspectable par l'humain à un attaquant d'apprendre de ton coffre (sur le nommage, le volume, l'âge) que le binaire brut refuserait ?

## Étape 3 : Déchiffre à la demande avec une piste d'audit

Un gestionnaire de secrets qui ne fait que chiffrer est un classeur verrouillé sans trou de serrure. Le chemin de lecture compte autant que le chemin d'écriture — et le chemin *d'audit* est tout l'intérêt d'un gestionnaire plutôt que d'un simple chiffrement. Cette étape déchiffre un secret du coffre *et enregistre chaque tel accès dans `audit.log`*, horodatages compris. Tu construis la redevabilité : le journal est la partie qui attrape le scélérat.

**👟 Indice de départ :** Commence par écrire `load(name)` — octets-depuis-hex des `ct` et `nonce` stockés, remets-les à `AESGCM(key()).decrypt(...)`, et `.decode()` le résultat — puis ajoute `audit(name)` pour ajouter une ligne de lecture horodatée UTC.

```python
# secret_manager.py (suite)
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

`load` parcourt l'inverse exact de `store` : octets-depuis-hex pour chaque artefact, remet clé+nonce+texte chiffré à `AESGCM.decrypt`, et `.decode()` le texte en clair. Les modes d'échec sont délibérés — un nom manquant lève une `KeyError` (une *bruyante* erreur de programmation, pas un `None` silencieux), et un texte chiffré falsifié lève `InvalidTag` (l'Étape 5 exploite cela). `audit` est délibérément *séparée* de `load` pour que tu puisses appeler le déchiffrement dans un REPL sans bruit de journalisation — mais l'appariement est la discipline : les gestionnaires de production journalisent chaque `load`, et l'horodatage est l'UTC (`datetime.timezone.utc`) pour qu'un ordinateur à midi-config ne brouille pas la piste.

**🎯 Résultat attendu :** Le secret s'imprime aller-retour (`sk-live-9f2e11`), et `audit.log` gagne une ligne, par ex. `2026-09-06T14:02:11.123456+00:00  read  github_token`.

**🩹 Si ça ne marche pas :** Si une `KeyError` se déclenche sur un nom que tu *sais* être dans le coffre, la clé JSON a des espaces ou un décalage de casse — imprime `data.keys()` et compare exactement. Si `InvalidTag` apparaît sur un store frais, le fichier de clé a changé entre `store` et `load` — un `master.key` différent signifie un *ensemble* de textes chiffrés qui ne peuvent jamais se déchiffrer ; régénère la clé *et* rechiffre chaque secret (ou copie l'ancienne clé de retour). Si le fichier d'audit grandit sans borne, c'est le comportement correct pour une courte exécution — la danse « rotation qui archive les anciens journaux » appartient à l'Étape 4.

**✅ Liste de vérification**

- ✅ Le déchiffrement reproduit le texte en clair exact (`repr` ne montre aucun espace blanc final).
- ✅ `audit.log` contient un horodatage UTC + une ligne `read <nom>` par accès.
- ✅ Lire un nom inexistant lève une `KeyError` bruyante, pas `None`.

**🤔 Question(s) socratique(s)**

- `load` et `audit` sont deux fonctions que tu associes en *les appelant ensemble.* Dans un script, que se passe-t-il si un plantage survient entre `load` et `audit` — un secret a-t-il été lu sans être journalisé ? Nomme le motif (écrire la ligne du journal *avant* ou *après* le déchiffrement, et laquelle des deux défaillances tu préférerais cacher) qu'un système de production choisirait.
- Les journaux d'audit sont du texte en append-only. Un attaquant qui peut *écrire* dans `vault/` peut aussi écrire dans `audit/`. Qu'est-ce qui distingue un journal d'audit *à l'épreuve de la falsification* (chaîner le hachage de chaque ligne à la précédente) de celui-ci — et sous quel modèle de confiance le texte brut importe-t-il en premier lieu ?

## Étape 4 : Fais tourner la clé maîtresse et rechiffre

Les clés vieillissent comme les mots de passe — une clé qui a été dans une brèche *pourrait* être compromise, et la rotation est l'opération « change la serrure, réémet toutes les portes ». Dans un coffre c'est une danse en deux temps : *reclé* chaque texte chiffré stocké sous une clé fraîche (déchiffre avec l'ancienne, rechiffre avec la nouvelle), puis *sécurise l'ancienne clé* pour qu'elle ne puisse pas déchiffrer silencieusement l'ancienne matière. L'Étape 4 automatise le rechiffrement et scénarise bruyamment la décision « l'ancienne clé à la poubelle ».

**👟 Indice de départ :** Commence par écrire `rotate()` qui déchiffre chaque entrée du coffre avec la clé actuelle et la rechiffre sous une clé `os.urandom(32)` fraîche, puis retire l'ancien fichier de clé et déplace le nouveau dans son chemin canonique.

```python
# secret_manager.py (suite)

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

La boucle est le moteur de reclé : pour chaque entrée, déchiffre avec le `master.key` actuel, fabrique un nonce frais, rechiffre sous `new_key`, et réécrit tout le coffre. L'étape de clé retirée est là où vit la sécurité — `unlink()` l'ancien fichier de clé et `replace` le nouveau dans son chemin canonique pour que le *nom* `master.key` résolve toujours mais que les *octets* soient tout neufs. Le coffre stocke maintenant des textes chiffrés jamais liés à l'ancienne clé, et l'ancienne matière de clé est *partie*, point final — pas « cachée », *supprimée*.

**🎯 Résultat attendu :** La rotation se termine avec une clé fraîche de 32 octets à `keys/master.key`, `True` pour les deux vérifications d'existence, et chaque entrée du coffre se déchiffre toujours sous la nouvelle clé.

**🩹 Si ça ne marche pas :** Si une rotation plante à mi-boucle, certaines entrées sont clées sous la *nouvelle* clé pendant que d'autres restent sous l'ancienne — relancer `rotate()` rechiffre alors *doublement* les nouvelles. Fais la reclé dans un dict temporaire et n'écris qu'en cas de succès ; les écritures partielles sont le bug des rotations. Si `master2.key` traîne après le `replace`, le remplacement a échoué (déplacement cross-filesystem) — utilise la sémantique `Path.replace` qui écrase atomiquement quand les deux chemins sont dans le même dossier `keys/`.

**✅ Liste de vérification**

- ✅ Les octets de `master.key` diffèrent d'avant la rotation (diff `keys` ou re-hachage).
- ✅ Chaque nom se déchiffre toujours sous la clé rotative (tous les appels `load` réussissent).
- ✅ Aucun survivant `master2.key` dans `keys/` après le `replace`.

**🤔 Question(s) socratique(s)**

- La rotation rechiffre mais ne change PAS *les secrets eux-mêmes*. Une clé rotative laisse encore une ancienne clé API se déchiffrer — la rotation change *qui* peut lire les textes chiffrés via le contrôle des clés, pas *ce que* disent les textes chiffrés. Quand la rotation doit-elle être associée à la *réémission* du secret lui-même (pense « cet identifiant était dans un journal »), et pourquoi un gestionnaire ferait-il tourner la clé agressivement quoi qu'il arrive ?
- Le piège de l'atomicité — un plantage à mi-boucle laisse un *coffre hybride*. Conçois le correctif en deux lignes (construis le nouveau dict en mémoire, écris une seule fois) et nomme la conséquence réelle si tu l'ignores (certains secrets déchiffrables seulement par l'ancienne clé qui va à la poubelle).

## Étape 5 : Prouve la détection de falsification

La dernière étape est l'étape adverse — et le gain d'avoir utilisé AEAD en premier lieu. Quiconque a un accès en écriture à `vault` peut retourner des octets du texte chiffré, et la *seule* défense du déchiffreur est l'étiquette d'authentification. Cette étape corrompt délibérément un texte chiffré sauvegardé et regarde `AESGCM.decrypt` refuser — `InvalidTag` est toute l'histoire de sécurité en une exception : un texte chiffré altéré ne peut jamais se faire passer pour honnête.

**👟 Indice de départ :** Commence par charger une entrée du coffre, retourner un seul bit du texte chiffré avec `tampered[3] ^= 0x01`, et envelopper l'appel `AESGCM.decrypt` dans un `try/except InvalidTag`.

```python
# secret_manager.py (suite)
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

Un seul basculement de bit, `tampered[3] ^= 0x01`. Parce que GCM authentifie tout le texte chiffré sous l'étiquette calculée au moment du chiffrement, toute altération — un octet ou tous les octets — échoue la vérification d'étiquette, et `.decrypt` lève `InvalidTag` au lieu de retourner des déchets. C'est le contrat AEAD en une exception : *déchiffre tout ou ne décode rien*. Un chiffrement symétrique sans étiquette (AES/CBC brut) retournerait silencieusement un mauvais texte en clair à la place — un attaquant pourrait retourner des bits et obtenir un secret *confiant et faux* qui « se déchiffre » quand même. Le try/except est toute ta politique de réponse à la falsification : aucune confiance partielle, juste un refus bruyant.

**🎯 Résultat attendu :** `rejected — ciphertext was tampered with` — jamais le secret déchiffré, jamais de chaîne-déchets ; un honnête `InvalidTag` arrête le pipeline.

**🩹 Si ça ne marche pas :** Si le test de falsification *imprime quand même le secret*, l'étiquette n'a pas été validée — une cause classique est de déchiffrer avec une « étiquette » qui ressemble au nonce ou d'appeler la mauvaise surcharge d'API (l'AES brut n'a pas d'étiquette). Si l'import `InvalidTag` échoue (`from cryptography.exceptions import InvalidTag`), tu es sur une vieille version de `cryptography` — mets à niveau avec `uv add cryptography@latest`. Si tu retournes accidentellement `tampered[3] ^= 0` (XOR avec zéro), rien ne change et il se déchiffre *correctement* — c'est le rapport de bug : aucune mutation, aucune défaillance, et la leçon que « les octets inchangés n'alerient jamais ».

**✅ Liste de vérification**

- ✅ Un bit retourné produit `InvalidTag` et *aucun* texte en clair n'est imprimé.
- ✅ L'entrée non falsifiée se déchiffre toujours (le contrôle positif passe encore).
- ✅ Tu peux énoncer la garantie AEAD en une phrase : le texte chiffré est vérifiable à erreur non nulle, donc un seul octet altéré interrompt le déchiffrement.

**🤔 Question(s) socratique(s)**

- L'étiquette détecte *toute* modification, mais ne la détecte qu'au *moment du déchiffrement*. Un coffre qui ne déchiffre jamais un fichier corrompu « a l'air bien » pour toujours — où la sécurité mord-elle réellement (le moment de l'accès), et qu'est-ce que cela dit de *surveiller les tentatives de déchiffrement* plutôt que de seulement chiffrer ?
- L'AES brut (sans étiquette) *accepterait* un texte chiffré retourné et retournerait un secret différent à l'apparence plausible. Trace l'attaque réaliste sur un coffre CBC de *retours de bits contrôlés par l'attaquant transformant « montant=1 » en « montant=100 »*. Quel est le mot unique pour dire pourquoi le refus de GCM est une *fonctionnalité*, pas une nuisance, quand le texte chiffré vit dans un stockage non fiable ?

## ⚠️ Pièges courants

- **Une clé vivant à côté du coffre.** AES est dépourvu de sens si la même brèche qui a volé `vault.json` a aussi volé `master.key` — le chiffrement protège au repos, pas contre une compromission complète. Sépare le chemin de confiance (KMS/jeton/disque séparé) dans tout ce qui est réel.
- **La réutilisation du nonce sous une même clé.** Réutiliser un nonce GCM fuit le XOR des textes en clair et invalide l'étiquette. Toujours `os.urandom(12)` par chiffrement ; ne code jamais en dur ton nonce et ne le dérive pas du nom.
- **Un coffre hybride après une rotation interrompue.** Un plantage dans la boucle déchiffre-rechiffre laisse les entrées les plus anciennes sous l'ancienne clé (tout juste supprimée). Construis tout le nouveau dict en mémoire, puis écris une seule fois — les écritures atomiques ne sont pas un luxe.
- **Les surprises de `decode()` dues à des octets introduits en fraude.** Les allers-retours hex sont stricts ; un octet supplémentaire vagabond (un saut de ligne d'une édition manuelle) fait lever `bytes.fromhex` avant même que la vérification d'étiquette ne s'exécute. Valide l'hex au moment du stockage, ou récolte les erreurs au chargement.
- **Les chiffrements bruts qui « déchiffrent n'importe quoi ».** Un chiffrement sans étiquette retourne *un* texte en clair pour des données falsifiées — confiant et faux. Tout l'intérêt d'`AESGCM` est l'`InvalidTag` au premier bit retourné ; ne l'« optimise » pas pour un chemin de code plus rapide.

## Ce que tu viens de construire

Un gestionnaire de secrets fonctionnel : AES-256-GCM a chiffré un identifiant en texte chiffré authentifié ; un coffre JSON l'a persisté indexé par nom ; le déchiffrement l'a fait aller-retour avec une piste d'audit horodatée UTC ; une rotation a reclé tout le coffre sous une matière de clé fraîche de 32 octets ; et un test de falsification à un seul bit a prouvé que le coffre refuse un texte chiffré altéré avec `InvalidTag`. Les couches transférables vont au-delà du CLI : tu possèdes maintenant la discipline du nonce, la conviction « la clé vit sur une frontière de confiance différente », et le *ressenti* authentique d'un déchiffrement authentifié refusant un octet retourné — qui est le comportement de sécurité sur lequel les vraies plateformes comptent.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/secret-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/secret-manager) dans le dépôt du cours regroupe le module gestionnaire, un échafaudage `keys/` en `.gitignore`d, et un notebook qui chiffre, persiste, déchiffre, fait tourner la clé et teste la falsification en ligne. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute les cinq étapes du début à la fin.
:::

## Où aller à partir d'ici

- **Un vrai chemin de clé :** déplace `master.key` vers un chemin hors du dossier du coffre (ou une variable d'environnement), pour que la frontière de confiance de la Configuration sépare réellement les deux honneurs.
- **Un journal d'audit enchaîné :** chaîne de hachage `audit.log` (chaque ligne intègre le hachage de la ligne précédente) pour que la brèche « l'attaquant édite les deux fichiers » de l'Étape 3 se referme en une vraie piste à l'épreuve de la falsification.
- **Un enveloppeur CLI :** `argparse` avec `secret get github_token`, `secret set`, `secret rotate`, `secret ls` — les fonctions que tu as écrites, exposées comme un vrai outil shell.
- **Une rotation basée sur le temps :** exécute `rotate()` selon un calendrier (`schedule` ou une ligne cron) et archive les anciens `audit.log`s — le mot « gestionnaire », mérité.

## Partage ton projet avec la classe

Tu as construit un coffre, fait tourner tes propres clés en direct, ou obtenu un test de falsification qui t'a fait sourire ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README parcourt l'ajout du tien via une **pull request** du début à la fin : forker, créer une branche, commiter et ouvrir la PR. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓