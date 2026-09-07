---
title: "Gestionnaire de Mots de Passe"
description: "Générez, stockez et auditez les mots de passe avec détection de fuites et partage en équipe."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["security", "cryptography", "cli", "hashing"]
xpReward: 50
learningObjectives:
  - Générer des mots de passe aléatoires cryptographiquement sûrs avec des jeux de caractères personnalisables
  - Calculer l'entropie d'un mot de passe et lui attribuer des étiquettes de force
  - Vérifier les mots de passe contre la base de données de fuites Have I Been Pwned en utilisant la k-anonymat
  - Stocker et récupérer des identifiants dans un fichier de coffre-fort chiffré en AES
  - Construire une interface en ligne de commande avec argparse
  - Suivre l'âge des mots de passe et signaler les entrées expirées
  - Produire des rapports de terminal formatés et colorés
prerequisites:
  - Les bases des chaînes et des fonctions en Python
  - La compréhension des listes et des boucles
  - La familiarité avec pip/uv pour installer des paquets
---

# Gestionnaire de Mots de Passe

Tu utilises le même mot de passe partout, parce qu'en inventer un nouveau à chaque fois est fastidieux. Dans ce projet, tu vas construire un outil qui fait la partie fastidieuse à ta place : il génère des mots de passe forts, mesure à quel point ils sont difficiles à craquer, vérifie s'ils sont déjà apparus dans une fuite de données, et les stocke dans un coffre-fort chiffré que tu peux déverrouiller avec un mot de passe maître.

Ce projet ne suppose que les bases de niveau « Python 101 » — fonctions, listes, dictionnaires, boucles et formatage de chaînes. Pas de frameworks, pas de bases de données, pas de services cloud. Tout ce dont tu as besoin provient de la bibliothèque standard plus un petit paquet de chiffrement.

C'est optionnel et non noté. Vois [Projets du monde réel](/docs/projects) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Générer des mots de passe cryptographiquement sûrs avec des jeux de caractères personnalisables en utilisant le module `secrets`.
2. Analyser la force d'un mot de passe en calculant son entropie — la mesure mathématique de l'imprévisibilité.
3. Vérifier les mots de passe contre la base de données de fuites Have I Been Pwned sans jamais envoyer le mot de passe complet (k-anonymat).
4. Construire un coffre-fort chiffré qui stocke des identifiants protégés par un mot de passe maître en utilisant AES-256.
5. Créer une interface CLI avec `argparse` pour que l'outil fonctionne depuis la ligne de commande.
6. Ajouter un suivi d'expiration des mots de passe qui signale les entrées de plus de 90 jours.
7. Peaufiner la sortie avec un formatage de terminal coloré et un rapport de synthèse.

## Où exécuter ceci

- **En local avec `uv` (recommandé).** Ce projet a besoin d'un paquet tiers (`cryptography`) pour le chiffrement — un bon candidat pour exécuter Python sur ta propre machine. La section Configuration ci-dessous détaille le processus.
- **Playground JupyterLite.** Colle les blocs de code dans des cellules et exécute-les dans le navigateur. L'étape de vérification des fuites a besoin d'une connexion réseau ; l'étape du coffre-fort crée des fichiers dans le stockage éphémère du navigateur.
- **Google Colab.** Clique sur le badge Colab sur la page du projet pour l'exécuter dans un notebook cloud. Note que les fichiers de coffre-fort créés dans Colab ne survivent pas entre deux sessions.

## Configuration

`uv` est un outil unique qui remplace la chaîne habituelle « installe Python, puis pip, puis un environnement virtuel, puis les paquets » — il gère ensemble les versions de Python et les dépendances.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme que c'est installé :

```bash
uv --version
```

Ensuite, mets en place le projet :

```bash
uv init password-generator
cd password-generator
uv add secrets hashlib cryptography httpx
```

Le module `secrets` est fourni avec Python et offre des nombres aléatoires cryptographiquement forts. Le paquet `cryptography` fournit le chiffrement AES pour le coffre-fort. Le paquet `httpx` gère les requêtes HTTP vers l'API de vérification des fuites. Le module `hashlib` (aussi intégré) calcule les hachages SHA-1 pour la recherche par k-anonymat.

## Étape 1 : Génère des mots de passe sûrs

La première brique : une fonction qui produit un mot de passe aléatoire avec exactement les types de caractères que tu veux. L'idée clé est *quel* module aléatoire utiliser — le module `random` de Python est conçu pour les simulations, pas pour la sécurité. Il est déterministe si tu connais la graine. Le module `secrets` utilise la vraie source aléatoire du système d'exploitation et est le bon choix pour tout ce qui touche à la sécurité.

### 1.1 Construis le pool de caractères

**👟 Indice de départ :** Importe `secrets` et `string`. Écris une fonction `generate_password` qui accepte des arguments nommés contrôlant quels types de caractères inclure (`use_uppercase`, `use_lowercase`, `use_digits`, `use_symbols`). Commence par construire une chaîne `charset` à partir des types que l'appelant veut.

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

L'astuce est la liste `required` : on choisit d'abord un caractère de chaque type activé, puis on remplit le reste du mot de passe depuis le pool complet. Cela garantit que chaque type demandé apparaît au moins une fois. Ensuite, `SystemRandom().shuffle` mélange les positions, pour que la lettre minuscule garantie ne soit pas toujours le premier caractère.

**🎯 Résultat attendu :** Génère quelques exemples et inspecte-les :

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

Chaque sortie devrait faire 20 caractères, contenir au moins une minuscule, une majuscule, un chiffre et un symbole.

### 1.2 Vérifie les garanties

**👟 Indice de départ :** Écris une vérification rapide qui affirme que chaque type de caractère est présent dans le mot de passe généré. C'est un test de cohérence, pas du code de production — confirme simplement que ta logique `required` fonctionne.

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

**🩹 Si ça ne marche pas :** Si une assertion échoue, le pool du type de caractère est probablement vide pour l'un des types. Vérifie que chaque bloc `if use_*` fait bien un ajout (`append`) à la fois à `charset` et à `required`. Si tu obtiens `ValueError: At least one character type must be selected`, les quatre drapeaux sont à `False` — passe `use_lowercase=True` au minimum.

### 1.3 Confirme l'exactitude

**✅ Liste de vérification**

- `generate_password(length=20)` retourne une chaîne d'exactement 20 caractères de long.
- Chaque mot de passe généré contient au moins une minuscule, une majuscule, un chiffre et un symbole.
- Générer 100 mots de passe dans une boucle produit 100 résultats distincts (aucune répétition).
- Passer `use_symbols=False` produit des mots de passe sans symboles.
- Passer `length=8` avec tous les types activés retourne une chaîne de 8 caractères.

**🤔 Question(s) socratique(s)**

- Si tu remplaçais `secrets.choice` par `random.choice` dans toute cette fonction, la sortie *paraîtrait-elle* différente à un œil humain ? Et à quelqu'un qui connaîtrait la graine ? Pourquoi cette distinction compte-t-elle pour des mots de passe ?

## Étape 2 : Analyse la force d'un mot de passe

Une chaîne aléatoire n'est forte que suivant le pool dont elle est tirée. La mesure mathématique est l'**entropie** — le nombre de bits d'information qu'un attaquant devrait deviner pour trouver le mot de passe. Un mot de passe tiré d'un pool de 70 caractères, long de 16 caractères, a log2(70^16) ≈ 97,4 bits d'entropie. C'est un nombre utile, car il se traduit directement en nombre d'essais dont un attaquant par force brute a besoin.

### 2.1 Calcule l'entropie

**👟 Indice de départ :** Écris `calculate_entropy(password)` qui détermine quels pools de caractères sont présents (minuscules, majuscules, chiffres, symboles), additionne leurs tailles dans un `charset_size`, et retourne `len(password) * math.log2(charset_size)`.

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

**🎯 Résultat attendu :** Essaie quelques cas connus :

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

Le mot de passe aléatoire de 16 caractères se situe autour de 97 bits — bien au-dessus du seuil de 80 bits que la plupart des directives de sécurité considèrent comme « très fort ».

### 2.2 Associe l'entropie à des étiquettes lisibles

Les nombres sont précis mais pas intuitifs. Une fonction `strength_label` transforme l'entropie en quelque chose sur lequel une personne peut agir.

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

### 2.3 Affiche une barre de force visuelle

Combine tout dans une fonction `analyze_password` qui affiche un rapport formaté.

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

**🎯 Résultat attendu :**

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

La barre se remplit proportionnellement : un bloc pour ~4 bits d'entropie, plafonné à 30 blocs pour la largeur de la barre.

**🩹 Si ça ne marche pas :** Si un mot de passe clairement aléatoire affiche « Weak », vérifie que `calculate_entropy` détecte bien les quatre pools de caractères. Un bug courant consiste à coder en dur la chaîne de symboles au lieu de réutiliser la constante `SYMBOLS` — si la chaîne codée en dur diffère ne serait-ce que d'un caractère, la vérification des symboles manque silencieusement certains mots de passe. Si `entropy` est `NaN`, le `charset_size` est nul, ce qui signifie que `calculate_entropy` n'a trouvé aucun des quatre pools — assure-toi que le mot de passe n'est pas vide.

### 2.4 Vérifie l'analyse

**✅ Liste de vérification**

- `"abc"` (3 caractères, uniquement des minuscules) est étiqueté « Very Weak » avec une entropie sous 20 bits.
- `"password123"` (un motif courant) est étiqueté « Weak » malgré ses 11 caractères, car son jeu de caractères est petit.
- Un mot de passe aléatoire de 16 caractères de l'Étape 1 est étiqueté « Very Strong » avec une entropie au-dessus de 95 bits.
- Un mot de passe aléatoire de 24 caractères affiche une entropie plus élevée que la version de 16 caractères.
- La barre de visualisation se remplit davantage pour les mots de passe plus forts.

**🤔 Question(s) socratique(s)**

- Pourquoi `"password123"` a-t-il une faible entropie malgré ses 11 caractères ? Si un attaquant sait que les gens ont tendance à choisir des mots de dictionnaire plus des chiffres, comment cela change-t-il la taille *effective* du jeu de caractères, comparé à ce que suppose `calculate_entropy` ?

## Étape 3 : Vérifie contre les bases de données de fuites

Même un mot de passe à haute entropie ne vaut rien s'il est déjà apparu dans une fuite de données. L'API Have I Been Pwned (HIBP) permet de vérifier — mais tu ne devrais jamais envoyer ton vrai mot de passe à un serveur tiers. La solution est la **k-anonymat** : tu n'envoies que les 5 premiers caractères du hachage SHA-1 du mot de passe et tu reçois en retour une liste de suffixes de hachages correspondants. Ton mot de passe complet ne quitte jamais ta machine.

### 3.1 Comprends le protocole de k-anonymat

Le déroulement est le suivant :

1. Hache le mot de passe avec SHA-1 : `SHA1("password123") = "CBFDAC6008F9CAB4083784CBD1874F76618D2A97"`
2. Envoie les 5 premiers caractères (`CBFDA`) à `https://api.pwnedpasswords.com/range/CBFDA`
3. L'API répond avec des milliers de lignes, chacune étant un suffixe de hachage et un compte : `C6008F9CAB4083784CBD1874F76618D2A97:42`
4. Cherche dans la réponse ton suffixe de hachage complet (`C6008F9CAB4083784CBD1874F76618D2A97`). S'il est trouvé, ton mot de passe est apparu dans `42` fuites.
5. Le serveur ne connaît qu'un préfixe de 5 caractères qui correspond à des millions de mots de passe possibles — il ne peut pas déterminer quel mot de passe spécifique tu vérifies.

### 3.2 Implémente le vérificateur de fuites

**👟 Indice de départ :** Tu as besoin de `hashlib` (intégré) pour SHA-1 et de `httpx` pour la requête HTTP. Le corps de la réponse est du texte brut avec un suffixe de hachage par ligne.

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

**🎯 Résultat attendu :** Teste avec un mot de passe dont tu sais qu'il a été compromis, et un que tu viens de générer :

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

Un mot de passe aléatoire fraîchement généré ne devrait jamais apparaître dans la base de données des fuites. Si c'est le cas, la source aléatoire est cassée — retourne à l'Étape 1 et confirme que tu utilises `secrets`, pas `random`.

**🩹 Si ça ne marche pas :** Si tu obtiens `Breach check failed: ...`, ton réseau bloque peut-être la requête ou l'API est temporairement en panne — la fonction retourne `False, 0` en cas d'échec pour que l'outil ne plante pas. Si tu obtiens `ConnectionError`, vérifie ta connexion Internet. Si tu obtiens `403`, l'API limite le débit des requêtes — attends un moment et réessaie. Si un mot de passe connu comme compromis, tel que `"password123"`, revient comme non compromis, vérifie que le hachage SHA-1 est en majuscules et que la comparaison du suffixe est exacte (pas d'espace supplémentaire, aucun `.strip()` nécessaire du côté droit du `split(":")`).

### 3.3 Vérifie le vérificateur de fuites

**✅ Liste de vérification**

- `"password123"` retourne `True` avec un compte de plusieurs millions.
- `"123456"` retourne `True` avec un compte très élevé.
- Un mot de passe fraîchement généré de l'Étape 1 retourne `False, 0`.
- La fonction gère élégamment les erreurs réseau — pas de traceback, juste un avertissement et `False, 0`.
- Le mot de passe complet n'apparaît jamais dans une instruction print ni dans un journal.

**🤔 Question(s) socratique(s)**

- L'API retourne des résultats pour des millions de hachages de mots de passe qui partagent le même préfixe de 5 caractères. Si le préfixe de ton mot de passe est `CBFDA`, à propos de combien d'*autres* mots de passe fuis-tu des informations au serveur en faisant la requête ? Pourquoi est-ce acceptable dans cette conception ?

## Étape 4 : Construis un coffre-fort chiffré

Générer des mots de passe forts n'est que la moitié de la valeur — tu dois aussi les stocker quelque part. Les écrire dans un fichier en texte clair va à l'encontre du but. À la place, nous chiffrerons le coffre-fort avec **AES-256** en utilisant l'implémentation Fernet du paquet `cryptography`. Le coffre-fort est déchiffré à l'exécution avec un mot de passe maître que tu saisis une fois.

### 4.1 Déduis une clé de chiffrement du mot de passe maître

Fernet a besoin d'une clé de 32 octets encodée en base64 compatible URL. On en déduit une du mot de passe maître en utilisant SHA-256 (en production, tu utiliserais PBKDF2 ou argon2 pour une dérivation de clé plus lente, mais cela démontre le fonctionnement).

**👟 Indice de départ :** Hache le mot de passe maître avec SHA-256, puis encode le résultat en base64.

```python
from cryptography.fernet import Fernet
import base64

def derive_key(master_password: str) -> bytes:
    """Derive an AES key from a master password."""
    key = hashlib.sha256(master_password.encode()).digest()
    return base64.urlsafe_b64encode(key)
```

### 4.2 Sauvegarde le coffre-fort

**👟 Indice de départ :** Écris `save_vault(vault, master_password, filepath)` qui convertit le dictionnaire du coffre-fort en chaîne, le chiffre avec Fernet, et écrit le texte chiffré sur le disque.

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

### 4.3 Charge le coffre-fort

**👟 Indice de départ :** Écris `load_vault(master_password, filepath)` qui lit le texte chiffré, le déchiffre, et reconvertit la chaîne en dictionnaire. Gère les deux cas d'échec : fichier introuvable (départ à zéro) et mauvais mot de passe (déchiffrement corrompu).

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

**🎯 Résultat attendu :** Crée un coffre-fort avec deux entrées, sauvegarde-le, recharge-le et vérifie :

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

Maintenant, essaie de charger avec le mauvais mot de passe :

```python
loaded_bad = load_vault("wrong-password")
```

```
Wrong master password or corrupted vault.
```

Le mauvais mot de passe produit un dictionnaire vide et un message d'erreur clair — pas de traceback, pas de plantage.

**🩹 Si ça ne marche pas :** Si tu obtiens `InvalidToken` avec un traceback au lieu du message convivial, le bloc `except Exception` ne capte pas l'erreur de Fernet. Vérifie que `from cryptography.fernet import Fernet` est en haut de ton fichier — si l'import manque, `Fernet` est indéfini et le bloc `except` échoue avant de pouvoir gérer l'erreur. Si le fichier du coffre-fort est toujours vide après rechargement, la conversion `str(vault)` produit peut-être quelque chose que `eval()` ne peut pas analyser — vérifie que le dictionnaire du coffre-fort ne contient que des chaînes, pas des objets ni des fonctions.

:::warning[eval() est dangereux en production]
`eval()` exécute du code Python arbitraire. C'est acceptable pour un projet d'apprentissage personnel où tu contrôles le fichier du coffre-fort, mais en production tu devrais utiliser `json.loads()` au lieu de `eval()` pour la désérialisation. Le format du coffre-fort devrait alors utiliser des types compatibles JSON (pas de tuples, pas d'ensembles, pas d'objets personnalisés).
:::

### 4.4 Vérifie le coffre-fort

**✅ Liste de vérification**

- Sauvegarder un coffre-fort avec deux entrées crée un fichier `vault.enc` sur le disque.
- Charger avec le bon mot de passe maître retourne les deux entrées avec leurs noms d'utilisateur et mots de passe intacts.
- Charger avec un mauvais mot de passe maître affiche une erreur et retourne un dictionnaire vide.
- Charger quand aucun fichier de coffre-fort n'existe affiche un message et retourne un dictionnaire vide.
- Le contenu du fichier `vault.enc` est du texte chiffré binaire, pas du texte lisible.

**🤔 Question(s) socratique(s)**

- Si quelqu'un vole ton fichier `vault.enc`, combien de tentatives lui faudrait-il pour le déchiffrer ? Comment ce nombre change-t-il s'il sait que ton mot de passe maître ne fait que 8 lettres minuscules, par rapport à un mot de passe aléatoire de 20 caractères de l'Étape 1 ?

## Étape 5 : Interface CLI

L'outil fonctionne dans un interpréteur Python, mais les vrais outils vivent sur la ligne de commande. Nous envelopperons tout dans `argparse` pour que les utilisateurs puissent générer, vérifier, stocker et lister des mots de passe sans ouvrir Python.

### 5.1 Configure argparse

**👟 Indice de départ :** Utilise des sous-commandes avec `add_subparsers` — une pour `generate`, une pour `check`, une pour `store`, une pour `list`. Chaque sous-commande a ses propres drapeaux.

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

### 5.2 Connecte les commandes

**👟 Indice de départ :** Écris une fonction `main()` qui analyse les arguments et distribue vers les fonctions appropriées des Étapes 1 à 4.

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

**🎯 Résultat attendu :** Exécute depuis le terminal :

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

**🩹 Si ça ne marche pas :** Si tu obtiens `error: the following arguments are required`, tu as oublié de passer un drapeau obligatoire (comme `--master` ou `-u`). Si tu obtiens `unrecognized arguments`, vérifie l'ordre des sous-commandes — `generate` vient avant les drapeaux, pas après. Si `generate` n'affiche rien, `--count` est peut-être réglé à 0. Si `list` affiche du texte garbké, ton coffre-fort a été sauvegardé avec le format `str()` d'une version différente de Python — régénère-le.

### 5.3 Vérifie le CLI

**✅ Liste de vérification**

- `generate --length 20 --count 3` affiche trois mots de passe de 20 caractères, un par ligne.
- `generate --no-symbols` produit des mots de passe sans symboles.
- `check "password123"` affiche « Weak » et « Found in ... breaches. »
- `store github -u alice --master X` crée ou met à jour le fichier du coffre-fort.
- `list --master X` affiche toutes les entrées stockées dans un tableau formaté.
- Lancer `list` avec le mauvais mot de passe maître affiche une erreur, pas un traceback.

**🤔 Question(s) socratique(s)**

- Pourquoi `generate` affiche-t-il sur stdout au lieu de sauvegarder dans un fichier ? Quelle est l'avantage que cela donne à un outil CLI, comparé à toujours écrire sur le disque ?

## Étape 6 : Suivi d'expiration des mots de passe

Les mots de passe vieillissent. Un mot de passe généré il y a 90 jours a pu être compromis depuis. En ajoutant un horodatage à chaque entrée du coffre-fort, nous pouvons signaler les mots de passe anciens et rappeler à l'utilisateur de les changer.

### 6.1 Ajoute des horodatages aux entrées du coffre-fort

**👟 Indice de départ :** Au moment de stocker un identifiant, inclue une clé `"created_at"` avec l'horodatage ISO courant. Au moment de lister les entrées, compare l'âge par rapport à un seuil.

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

### 6.2 Vérifie les mots de passe expirés

**👟 Indice de départ :** Écris `check_expiry(vault, max_age_days)` qui retourne une liste de tuples `(service, created_at, days_old)` pour les entrées plus anciennes que le seuil.

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

### 6.3 Affiche l'expiration dans la vue de liste

**👟 Indice de départ :** Mets à jour la commande `list` pour afficher l'âge de chaque entrée et signaler les entrées expirées avec un symbole d'avertissement.

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

**🎯 Résultat attendu :**

```
  Service         Username             Age        Status
  --------------- -------------------- ---------- --------------------
  github          alice                95d        EXPIRED [!]
  email           alice@example.com    12d        OK

  1 password(s) older than 90 days. Rotate them.
```

**🩹 Si ça ne marche pas :** Si toutes les entrées affichent un âge « unknown », la clé `created_at` n'a pas été ajoutée au moment du stockage — retourne à la fonction `store_credential` et assure-toi qu'elle est appelée au lieu de construire le dictionnaire à la main. Si le calcul d'âge semble faux, vérifie que `datetime.now()` et `datetime.fromisoformat()` utilisent la même notion de fuseau horaire (les deux naïfs, ou les deux conscients — ne les mélange pas).

### 6.4 Vérifie le suivi d'expiration

**✅ Liste de vérification**

- Une entrée fraîchement stockée affiche le statut « OK » avec un âge de 0d.
- Une entrée avec `created_at` réglé à 100 jours dans le passé affiche le statut « EXPIRED [!] ».
- Une entrée sans clé `created_at` affiche un âge « unknown », pas un plantage.
- La ligne de synthèse en bas ne compte que les entrées expirées.

**🤔 Question(s) socratique(s)**

- Que se passe-t-il si l'utilisateur recule l'horloge système de 100 jours après avoir stocké un mot de passe ? La vérification d'expiration fonctionnerait-elle toujours correctement ? Quel problème réel cela révèle-t-il à propos des contrôles de sécurité basés sur l'horodatage côté client ?

## Étape 7 : Peaufine la sortie

Le texte brut est fonctionnel mais difficile à parcourir. Ajouter de la couleur à la sortie du terminal rend mots de passe forts/faibles, compromis/sains et entrées expirées/récentes visuellement distincts d'un coup d'œil.

### 7.1 Ajoute les codes de couleur ANSI

**👟 Indice de départ :** Définis des constantes de couleur avec des séquences d'échappement ANSI. Enveloppe le texte avec elles pour la sortie terminal uniquement — n'écris pas de codes d'échappement dans des fichiers.

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

### 7.2 Colorie la barre de force

**👟 Indice de départ :** Mets à jour `analyze_password` pour colorer la barre selon l'étiquette de force — rouge pour faible, jaune pour modéré, vert pour fort.

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

### 7.3 Colorie la vérification de fuites

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

### 7.4 Construis un rapport de synthèse

**👟 Indice de départ :** Écris `print_report` qui prend une liste de mots de passe, analyse chacun, et affiche un tableau de synthèse avec les comptes par niveau de force et l'entropie moyenne.

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

**🎯 Résultat attendu :**

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

**🩹 Si ça ne marche pas :** Si les couleurs n'apparaissent pas, ton terminal ne supporte peut-être pas les codes ANSI — essaie `export TERM=xterm-256color` avant d'exécuter. Si tu vois des séquences d'échappement brutes comme `[91m` dans la sortie, les caractères d'échappement ne sont pas interprétés — assure-toi d'utiliser `\033[` (le vrai caractère ESC), pas la chaîne littérale antislash-zéro-trois-trois.

### 7.5 Vérifie la sortie peaufinée

**✅ Liste de vérification**

- La barre de force est rouge pour les mots de passe faibles, jaune pour les modérés, et verte pour les forts.
- L'avertissement de fuite est rouge quand un mot de passe est trouvé dans des fuites.
- Le tableau de synthèse affiche les bons comptes pour chaque niveau de force.
- Le calcul d'entropie moyenne est correct.
- Exécuter l'outil dans un terminal qui supporte les codes ANSI affiche les couleurs ; rediriger vers un fichier n'inclut pas les séquences d'échappement.

**🤔 Question(s) socratique(s)**

- Pourquoi la fonction `colored()` ne devrait-elle être utilisée que pour la sortie terminal et pas pour écrire dans des fichiers de journal ? Que se passe-t-il si tu transmets la sortie colorée à `less` ou la rediriges vers un fichier ?

## ⚠️ Pièges courants

- **Utiliser `random` au lieu de `secrets`.** Le module `random` est déterministe et prévisible. Pour tout ce qui touche à la sécurité — mots de passe, jetons, clés — utilise toujours `secrets`. C'est la décision la plus importante de tout ce projet.
- **Oublier de mélanger les caractères obligatoires.** Si tu ajoutes les caractères obligatoires en premier puis remplis le reste, les premiers caractères sont toujours un de chaque type dans un ordre fixe. Un préfixe comme « aB1! » est un motif que les attaquants savent vérifier en premier. Mélange toujours.
- **Envoyer le mot de passe complet à l'API de fuites.** La conception de k-anonymat de HIBP existe précisément pour éviter cela. Seuls les 5 premiers caractères du hachage SHA-1 devraient jamais quitter ta machine.
- **Utiliser `eval()` dans du code de production.** `eval()` exécute du Python arbitraire. Pour un projet d'apprentissage personnel, c'est un moyen rapide de désérialiser le coffre-fort, mais en production utilise `json.loads()` avec un format de coffre-fort compatible JSON.
- **Sauvegarder le coffre-fort seulement à la sortie.** Si le programme plante en cours de session, les changements non sauvegardés sont perdus. Sauvegarde après chaque mutation — l'appel `save_vault` dans `store` le fait déjà.
- **Mélanger des datetime conscients et naïfs.** `datetime.now()` retourne un datetime naïf (sans fuseau horaire). Si tu le compares à un datetime conscient du fuseau via `datetime.now(timezone.utc)`, tu obtiendras un `TypeError`. Garde-les cohérents.

## Ce que tu viens de construire

Un outil complet de gestion de mots de passe en Python pur : génération de mots de passe cryptographiquement sûre, analyse de force basée sur l'entropie, détection de fuites contre une base de données publique en utilisant la k-anonymat, un coffre-fort chiffré AES-256, une interface en ligne de commande, un suivi d'expiration des mots de passe et une sortie terminal colorée. Chaque pièce s'appuie sur les fondamentaux du Python 101 — chaînes, listes, dictionnaires, boucles, fonctions — appliqués à un problème réel que tu rencontres tous les jours.

Les motifs de sécurité ici s'étendent bien au-delà des mots de passe : la k-anonymat est utilisée dans les données de santé et la confidentialité de localisation, le chiffrement AES est la norme pour les données au repos, et le calcul d'entropie est le fondement de toutes les métriques de force. Comprendre *pourquoi* ces techniques fonctionnent (et pas seulement comment les appeler) est ce qui distingue un script d'un outil auquel tu peux te fier.

## Où aller à partir d'ici

- **Utilise un vrai KDF.** Remplace la dérivation de clé SHA-256 par PBKDF2 (`cryptography.hazmat.primitives.kdf.pbkdf2`) ou argon2 pour la résistance à la force brute. Un hachage SHA-256 est rapide — un attaquant peut en tenter des milliards par seconde. PBKDF2 avec 600 000 itérations ralentit cela d'un facteur 600 000.
- **Ajoute une commande de copie dans le presse-papiers.** Une sous-commande `copy` qui met un mot de passe dans le presse-papiers et l'efface après 30 secondes est plus pratique que d'afficher sur stdout.
- **Implémente la détection de réutilisation de mots de passe.** Avant de stocker un nouvel identifiant, vérifie si le mot de passe apparaît déjà dans une autre entrée — un mot de passe fort réutilisé reste un point de défaillance unique.
- **Ajoute un format de coffre-fort JSON.** Migre de `eval()`/`str()` vers `json.dumps()`/`json.loads()` pour l'interopérabilité et la sécurité. JSON ne supporte pas les tuples ni les ensembles Python, mais le coffre-fort n'a besoin que de chaînes.
- **Construis une commande `rotate`.** Génère un nouveau mot de passe pour une entrée existante, met à jour l'horodatage, et copie éventuellement le nouveau mot de passe dans le presse-papiers — le tout en une commande.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
