---
title: "Journal d'Audit"
description: "Système de journal d'audit immuable avec détection de falsification, rapports de conformité et politiques de rétention."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Security", "Backend", "Data Visualization"]
prerequisites:
  - "Les classes, méthodes et état d'instance en Python"
  - "Lire et écrire des fichiers texte ligne par ligne"
  - "Les bases de hashlib : ce qu'est un digest hexadécimal SHA-256"
learningObjectives:
  - "Modéliser un journal d'événements append-only dont les lignes portent un hachage chaîné de leur prédécesseur"
  - "Prouver la preuve de falsification en recalculant et comparant chaque maillon de la chaîne"
  - "Interroger le journal par sévérité et source et agréger les comptages pour un tableau de bord"
  - "Élaguer les anciennes entrées avec la rétention tout en ré-ancrant une chaîne toujours valide"
  - "Exporter un flux de conformité JSONL vérifié contre le journal source"
---

# 🛠️ 🔐 Construire un Journal d'Audit

Un journal d'audit est le compte-rendu que tu montres à l'enquêteur *après* que quelque chose a mal tourné : qui a fait quoi, dans quel ordre, et — surtout — si l'un d'entre eux a été silencieusement modifié par la suite. Un fichier de lignes de texte ne prouve rien par lui-même ; une édition de texte brut ressemble à un vrai événement. Ce projet construit la structure qui rend la réécriture détectable : un journal append-only où chaque entrée porte un hachage SHA-256 de son propre contenu **plus** le hachage de l'entrée précédente, formant une chaîne. Change une ligne où que ce soit et chaque lien suivant se brise ; un simple passage `verify()` signale exactement quelle entrée a été touchée. Autour de ce noyau, tu ajouteras des requêtes par sévérité et source, un élagage de rétention qui garde la chaîne valide, et un export JSONL pour les tableaux de bord et les outils de conformité. Tout tourne sur la bibliothèque standard et est déterministe — les mêmes seize événements se vérifient de la même façon à chaque fois.

Cela suppose les classes, les méthodes, l'entrée/sortie de fichiers et un premier aperçu de `hashlib.sha256`. C'est un projet facultatif et non noté — consulte [Projets du monde réel](/fr/projets) pour la liste complète et grandissante.

## 🎯 Ce que tu vas faire

1. Écrire un journaliste append-only qui stocke les événements sur une seule ligne chacun.
2. Ajouter une chaîne de hachage, puis prouver qu'elle attrape une entrée falsifiée.
3. Interroger par sévérité et source, et compter les événements par sévérité.
4. Élaguer les anciennes entrées avec la rétention tout en gardant la vérification verte.
5. Exporter un flux de conformité JSONL et un résumé lisible par un humain.

## Où exécuter ceci

**Localement avec `uv`** est le chemin recommandé — le journal est pure bibliothèque standard (`hashlib`, `pathlib`, `json`), donc un `uv init` est tout ce qu'il te faut.

**Google Colab, Kaggle Notebooks et Binder** exécutent chaque étape sans modification. Utilise un chemin local au projet (par ex. `audit.log`) plutôt qu'un chemin système ; les notebooks et Binder laissent tous deux ce fichier vivre à côté du code.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audit-logger/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audit-logger/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Faudit-logger%2Fnotebook.fr.ipynb)

## Configuration

Tout ce qu'il faut avant le premier événement.

### Configure le projet

```bash
uv init audit-logger
cd audit-logger
```

Aucune dépendance. Le journal est un fichier `.txt` avec un événement par ligne ; la définition d'« append-only » est juste `open(..., "a")`.

**✅ Liste de vérification**

- ✅ `uv init audit-logger` crée le projet et un `main.py`.
- ✅ `uv run python3 -c "import hashlib, pathlib, json"` réussit — tout est bibliothèque standard.

**🤔 Question(s) socratique(s)**

- Une ligne de journal comme `INFO auth login ok` ne prouve à elle seule rien sur sa propre authenticité. Quelles deux propriétés un journal *inviolable* doit-il avoir au-delà de « c'est un fichier que quelqu'un a écrit » ?
- La chaîne hache chaque entrée contre son prédécesseur, donc l'*ordre* fait partie de la preuve. Pourquoi l'ordre compte-t-il pour un journal d'audit — qu'est-ce qu'un journal falsifié mais réordonné cacherait-il ?

## Étape 1 : Un journal d'événements en append-only

D'abord, de la journalisation append-only honnête et ordinaire : les événements deviennent des lignes dans un fichier. La preuve de falsification vient à l'Étape 2.

### 1.1 L'helper de digest

**👟 Indice de départ :** Écris `digest(*parts)` qui joint les parties avec `|` et retourne le digest hexadécimal SHA-256 — le liant pour chaque hachage que tu calculeras.

```python
# main.py
import hashlib, pathlib, json

def digest(*parts):
    return hashlib.sha256("|".join(parts).encode()).hexdigest()

print(digest("1", "2025-06-01T10:00:00", "INFO", "auth", "login ok"))
```

`"|".join(parts)` rend la chaîne que tu haches non ambiguë : sans séparateur, `"a" + "bc"` et `"ab" + "c"` se heurtent ; avec `|`, `("a","bc")` et `("ab","c")` diffèrent en octets. Le digest hexadécimal est déterministe — mêmes entrées, même sortie, pour toujours — ce qui est la propriété sur laquelle toute la chaîne s'appuie.

**🎯 Résultat attendu :** Une chaîne hexadécimale de 64 caractères (p. ex. `f0c2…`) : les digest SHA-256 font toujours 64 caractères hex, quelle que soit la longueur de l'entrée.

**🩹 Si ça ne marche pas :** Si la longueur de la sortie diffère de 64, tu n'appelles pas `sha256` (`md5` donne 32). Si un `TypeError` apparaît, une partie non-chaîne s'est glissée — encode-la/`str()`-la d'abord.

### 1.2 Ajoute des événements comme lignes

**👟 Indice de départ :** Écris `AuditLog(path)` avec un `append(severity, source, message, ts)` qui ajoute une ligne jointe par `|` par événement.

```python
# main.py (continued)
class AuditLog:
    def __init__(self, path):
        self.path = pathlib.Path(path)
        self._seq = 0

    def append(self, severity, source, message, ts="2025-06-01T10:00:00"):
        self._seq += 1
        payload = [str(self._seq), ts, severity, source, message]
        with self.path.open("a") as f:
            f.write("|".join(payload) + "\n")
        return self._seq

log = AuditLog("audit.log")
log.append("INFO", "auth", "login ok", ts="2025-06-01T10:00:00")
log.append("INFO", "auth", "logout ok", ts="2025-06-01T10:01:00")
print(log.path.read_text())
```

`open("a")` est le *mode* qui rend la promesse append-only réelle : chaque appel écrit à la fin et ne réécrit jamais les octets précédents. Le compteur `seq` donne aux événements un ordre explicite qui survit même si les horodatages sont égaux. Le payload joint par `|` est l'enregistrement de données du journal — la chaîne à l'Étape 2 s'enroule autour.

**🎯 Résultat attendu :**

```
1|2025-06-01T10:00:00|INFO|auth|login ok
2|2025-06-01T10:01:00|INFO|auth|logout ok
```

**🩹 Si ça ne marche pas :** Si le fichier écrase au lieu d'ajouter, `open` a utilisé le mode `"w"`. Si les lignes se chevauchent, le `\n` final manque dans l'écriture.

### 1.3 Aie une genèse

**👟 Indice de départ :** Ajoute `GENESIS = digest("GENESIS")` pour que la première entrée ait un hachage vers lequel pointer.

```python
# main.py (continued)
GENESIS = digest("GENESIS")
print(GENESIS[:16], "...")
```

Chaque chaîne a besoin du prédécesseur de son premier maillon. `GENESIS` est cette ancre constante : l'entrée 1 pointe *vers* elle, et une fois que l'entrée 1 existe, la chaîne ne référence que de vraies entrées. Il n'y a rien de secret dans la chaîne `"GENESIS"` — son rôle est d'être un point de départ **fixe et connu** que tout le monde vérifie contre.

**🎯 Résultat attendu :** Seize caractères hex suivis de `...` (les 64 complets sont sur la première ligne de la section de l'Étape 1.1 — même helper, même fonction).

**🩹 Si ça ne marche pas :** Si `GENESIS` varie entre les exécutions, tu haches une partie dépendante du temps. Ce doit être un littéral.

### 1.4 Vérifie la couche d'ajout

**✅ Liste de vérification**

- ✅ Deux appels à `append` produisent exactement deux lignes jointes par `|`, dans l'ordre.
- ✅ Rouvrir le même chemin `AuditLog` et ajouter écrit la troisième ligne à la fin.
- ✅ `GENESIS` est une constante — même valeur à chaque exécution de l'interpréteur.

**🤔 Question(s) socratique(s)**

- Append-only est une *politique* ici (tu contrôles le code qui écrit). Où la vraie preuve que « personne n'a réécrit l'histoire » doit-elle vivre — dans la convention d'écriture, ou dans quelque chose de vérifiable plus tard ? Cette chose vérifiable, c'est l'Étape 2.
- Le fichier contient les événements en clair, lisibles par n'importe qui. Est-ce une faiblesse pour un journal *d'audit*, et qu'ajouterais-tu — chiffrement, signatures ou permissions — sans casser la chaîne ?

## Étape 2 : La chaîne de hachage — et le test de falsification

Maintenant, la récompense : chaque entrée stocke le hachage de l'entrée précédente, ce qui fait que toute édition casse la chaîne. Puis tu vérifies — et tu la regardes attraper une édition plantée dedans.

### 2.1 Relie chaque entrée à son prédécesseur

**👟 Indice de départ :** Dans `append`, lis le dernier hachage stocké (en commençant par `GENESIS`), calcule le maillon suivant comme `digest(*payload, prev)`, et stocke `prev` et le nouveau hachage sur la ligne.

```python
# main.py (continued)
    def rows(self):
        return [line.split("|") for line in self.path.read_text().splitlines()]

    def _last_hash(self):
        if not self.path.exists() or not self.path.read_text().strip():
            return GENESIS
        return self.rows()[-1][-1]

    def append(self, severity, source, message, ts="2025-06-01T10:00:00"):
        self._seq += 1
        prev = self._last_hash()
        payload = [str(self._seq), ts, severity, source, message]
        h = digest(*payload, prev)
        with self.path.open("a") as f:
            f.write("|".join(payload + [prev, h]) + "\n")
        return self._seq, h

log.append("WARN", "payments", "retry #1", ts="2025-06-01T10:02:00")
row = log.rows()[-1]
print(row)
```

Chaque ligne a maintenant sept champs : les cinq champs de données, le hachage précédent, et le propre hachage de l'entrée `digest(*payload, prev)`. Le hachage *inclut* `prev`, donc l'ordre fait partie de la preuve. L'entrée suivante lit le dernier hachage de cette entrée et l'enroule vers l'avant — une chaîne littérale, un maillon par ligne.

**🎯 Résultat attendu :** Une liste à 7 champs dont le dernier champ est un hachage de 64 caractères, p. ex. `['3', '2025-06-01T10:02:00', 'WARN', 'payments', 'retry #1', '…', '…']`.

**🩹 Si ça ne marche pas :** Si la ligne a six champs, `payload + [prev, h]` n'a pas été joint. Si le hachage stocké ne change pas entre les entrées, `_last_hash` ne lit pas la ligne précédente.

### 2.2 Vérifie la chaîne

**👟 Indice de départ :** Écris `verify()` qui parcourt les lignes, recalcule chaque hachage attendu à partir du payload et de `prev`, et retourne `(ok, position)` là où se trouve une rupture.

```python
# main.py (continued)
    def verify(self):
        expected = GENESIS
        for i, row in enumerate(self.rows()):
            payload, prev, stored = row[:5], row[5], row[6]
            if prev != expected:
                return False, i
            expected = digest(*payload, prev)
            if stored != expected:
                return False, i
        n = len(self.rows())
        return (True, n) if n else (False, 0)

log.append("ERROR", "payments", "charge declined", ts="2025-06-01T10:03:00")
log.append("ERROR", "net", "timeout", ts="2025-06-01T10:04:00")
log.append("WARN", "payments", "charge recovered", ts="2025-06-01T10:05:00")
print("verify:", log.verify())
```

`verify` rejoue la fonction exacte que `append` a utilisée : commence à `GENESIS`, et à chaque ligne confirme que le `prev` stocké correspond à l'endroit où se trouve la marche, puis confirme que le hachage stocké égale le hachage que `append` aurait écrit. Une chaîne intacte parcourt les six lignes jusqu'à `(True, 6)`.

**🎯 Résultat attendu :** `verify: (True, 6)`.

**🩹 Si ça ne marche pas :** Si `(True, 6)` s'affiche comme `(False, 0)`, la slice de payload dans `verify` a laissé tomber le champ message — beaucoup de débutants utilisent `row[:4]` et cassent chaque hachage. Utilise `row[:5]` (les cinq champs de données).

### 2.3 Plante une falsification et attrape-la

**👟 Indice de départ :** Corromps le message de la ligne 4, puis vérifie à nouveau — la rupture doit pointer exactement sur cette entrée.

```python
# main.py (continued)
lines = open("audit.log").readlines()                 # read all lines first
fields = lines[3].rstrip("\n").split("|")
fields[4] = fields[4].replace("declined", "DECLINED")
lines[3] = "|".join(fields) + "\n"
open("audit.log", "w").write("".join(lines))          # truncate only at the end

print("after edit:", log.verify())
```

Réécrire le fichier n'est pas spécial — le but est que l'outil *le remarque*. Le payload de la ligne 4 a changé, donc son hachage stocké ne correspond plus à `digest(*payload, prev)`, et `verify` signale la rupture à l'index de ligne 3. N'importe quelle édition où que ce soit est attrapée, parce que chaque maillon de chaîne suivant serait aussi en désaccord. (Restaure le fichier — réécris-le depuis zéro — avant l'Étape 3.)

**🎯 Résultat attendu :** `after edit: (False, 3)` — l'entrée falsifiée est l'entrée 4 (index 3).

**🩹 Si ça ne marche pas :** Si la vérification signale un index plus tardif, l'édition a changé des octets qui n'alimentent qu'un hachage stocké *ultérieur* — vérifie que tu as muté le champ message (index 4), pas le champ hachage (index 6).

### 2.4 Vérifie la chaîne

**✅ Liste de vérification**

- ✅ Six entrées honnêtes se vérifient comme `(True, 6)`.
- ✅ Éditer le message de l'entrée 4 produit `(False, 3)`.
- ✅ Éditer *n'importe quelle* entrée — message, sévérité ou ordre — casse à cette entrée ou après.

**🤔 Question(s) socratique(s)**

- La chaîne attrape les éditions mais pas la *suppression du fichier entier* ni une restauration en gros. Qu'est-ce qui distingue la preuve de falsification (cette étape) des signatures numériques (ta clé privée), et quel souci chacune résout-elle ?
- `verify` recalcule depuis `GENESIS` à chaque fois. Si le journal avait un million d'entrées, où irait le coût — et quel ajout bon marché (stocker le dernier hachage, revérifier depuis là) rend les vérifications ponctuelles rapides ?

## Étape 3 : Interroge et agrège

Un tas de lignes inviolable doit encore qu'on lui *pose des questions*. L'Étape 3 ajoute filtres et comptages.

### 3.1 Filtre par sévérité et source

**👟 Indice de départ :** Écris `select(severity=None, source=None)` retournant les lignes correspondantes comme les quatre champs de données que les gens lisent.

```python
# main.py (continued)
    def select(self, *, severity=None, source=None):
        out = []
        for row in self.rows():
            if severity and row[2] != severity:
                continue
            if source and row[3] != source:
                continue
            out.append(row[:4])
        return out

# fresh, intact log with the full six-event feed
fresh = AuditLog("audit2.log")
for s, src, msg, ts in [
    ("INFO", "auth", "login ok", "2025-06-01T10:00:00"),
    ("INFO", "auth", "logout ok", "2025-06-01T10:01:00"),
    ("WARN", "payments", "retry #1", "2025-06-01T10:02:00"),
    ("ERROR", "payments", "charge declined", "2025-06-01T10:03:00"),
    ("ERROR", "net", "timeout", "2025-06-01T10:04:00"),
    ("WARN", "payments", "charge recovered", "2025-06-01T10:05:00"),
]:
    fresh.append(s, src, msg, ts=ts)

print([r[2:4] for r in fresh.select(severity="ERROR")])
print([r[:2] for r in fresh.select(source="payments")])
```

`select` est un pur filtre sur `rows()` : pas d'état, pas de mutation — les mêmes lignes dedans, les mêmes réponses dehors, de façon déterministe. Tenir les champs de *données* `row[:4]` (en laissant tomber les deux hachages) rend la liste de résultats lisible et garde les hachages visibles dans `rows()` quand tu dois vérifier.

**🎯 Résultat attendu :**

```
[['ERROR', 'payments'], ['ERROR', 'net']]
[['1', '2025-06-01T10:00:00'], ['3', '2025-06-01T10:02:00'], ['4', '2025-06-01T10:03:00'], ['6', '2025-06-01T10:05:00']]
```

**🩹 Si ça ne marche pas :** Si un filtre ne retourne rien, la casse de sévérité/source diffère de celle du journal (`ERROR` stocké contre `error` interrogé). Si les deux filtres retournent tout le journal, les `continue` ont été remplacés par des ajouts, ou les arguments nommés n'ont jamais atteint la méthode.

### 3.2 Comptages pour un tableau de bord

**👟 Indice de départ :** Utilise `Counter` sur le champ sévérité pour obtenir les totaux par sévérité en une ligne.

```python
# main.py (continued)
from collections import Counter

def counts(rows):
    return dict(Counter(r[2] for r in rows))

print(counts(fresh.rows()))
```

`Counter(r[2] for r in rows)` classe chaque ligne de journal par sévérité et retourne les totaux : ce sont les chiffres que ton widget « erreurs des dernières 24 h » rend. Parce qu'il opère sur `rows()` (qui porte encore la chaîne), les mêmes données alimentent le tableau de bord et la vérification.

**🎯 Résultat attendu :** `{'INFO': 2, 'WARN': 2, 'ERROR': 2}`.

**🩹 Si ça ne marche pas :** Si une sévérité manque dans le dict, `Counter` ne définit que ce qu'il a compté — une sévérité avec zéro événement n'apparaîtra pas. Si les comptages totalisent plus de six, le fichier a des lignes en double laissées par la démo de falsification de l'Étape 2 — recommence frais avec `audit2.log`.

### 3.3 Vérifie la couche de requêtes

**✅ Liste de vérification**

- ✅ `select(severity="ERROR")` retourne exactement les entrées 4 et 5.
- ✅ `select(source="payments")` retourne quatre entrées : seqs 3, 4 et 6.
- ✅ `counts(rows)` retourne `{'INFO': 2, 'WARN': 2, 'ERROR': 2}` sur le journal intact.

**🤔 Question(s) socratique(s)**

- `select` retourne des *copies* (`row[:4]`), jamais des références aux lignes internes. Si un appelant mutait une entrée retournée (changeait une sévérité), le fichier changerait-il aussi — et est-ce la propriété que tu veux pour un journal d'audit ?
- Un tableau de bord montre `ERROR: 2`. Le même fichier dans la version falsifiée de l'Étape 2 montre des chiffres différents. Qu'est-ce que « vérifier le journal *avant* de faire confiance aux chiffres du tableau de bord » t'apporte que le tableau de bord seul ne peut pas ?

## Étape 4 : Rétention — élaguer sans casser la chaîne

Les journaux grandissent pour toujours ; les politiques de rétention les plafonnent. L'Étape 4 taille les anciennes entrées **et** ré-ancre la chaîne survivante pour qu'un journal élagué se vérifie quand même.

### 4.1 Taille les anciennes entrées

**👟 Indice de départ :** Écris `retain(since_seq)` qui garde les lignes avec `seq >= since_seq` et réécrit le fichier.

```python
# main.py (continued)
    def retain(self, since_seq):
        kept = [r for r in self.rows() if int(r[0]) >= since_seq]
        with self.path.open("w") as f:
            expected = GENESIS
            for row in kept:
                payload = row[:5]
                prev = row[5]
                if prev != expected:
                    prev = expected
                expected = digest(*payload, prev)
                f.write("|".join(payload + [prev, expected]) + "\n")
        return len(kept)

print("kept:", fresh.retain(3))
print(fresh.path.read_text())
```

Laisser tomber les lignes qui portaient les maillons de l'ancienne chaîne orphelinerait les valeurs `prev` des survivantes. `retain` corrige cela en redémarrant la marche à `GENESIS` et en recalculant le `prev`/hachage de chaque survivante pendant qu'il réécrit — le fichier rétrécit, et la chaîne se ré-ancre sur la première entrée gardée. La rétention est une *politique* de données, pas de la magie : garder les N plus récentes, garder tout après une date, garder seulement une sévérité — la même logique de réécriture s'en occupe.

**🎯 Résultat attendu :**

```
kept: 4
3|2025-06-01T10:02:00|WARN|payments|retry #1|…|…
4|2025-06-01T10:03:00|ERROR|payments|charge declined|…|…
5|2025-06-01T10:04:00|ERROR|net|timeout|…|…
6|2025-06-01T10:05:00|WARN|payments|charge recovered|…|…
```

**🩹 Si ça ne marche pas :** Si `kept` est 0, tu as tout élagué (`since_seq` trop haut) — sans danger mais vérifie le compte. Si le `prev` des survivantes pointe encore vers des lignes supprimées, le ré-ancrage `if prev != expected: prev = expected` manque et la chaîne échouera à la vérification.

### 4.2 Revérifie la chaîne élaguée

**👟 Indice de départ :** Relance `verify()` — la chaîne conservée doit revenir verte.

```python
# main.py (continued)
print("post-retention verify:", fresh.verify())
from collections import Counter
print(dict(Counter(r[2] for r in fresh.rows())))
```

Une bonne politique de rétention laisse un journal *plus petit mais toujours digne de confiance*. `verify()` qui recalcule depuis `GENESIS` prouve que la chaîne élaguée est auto-cohérente, et les comptages montrent les données de la politique : les deux entrées `INFO` de connexion ont disparu, leur preuve résumée seulement par ce qui a survécu.

**🎯 Résultat attendu :**

```
post-retention verify: (True, 4)
{'WARN': 2, 'ERROR': 2}
```

**🩹 Si ça ne marche pas :** Si `verify()` retourne `(False, …)` après l'élagage, le ré-ancrage a réécrit `prev` mais a oublié de recalculer le propre hachage de cette ligne, ou la première ligne gardée stocke toujours l'ancien prédécesseur (supprimé).

### 4.3 Vérifie la rétention

**✅ Liste de vérification**

- ✅ `retain(3)` sur un journal à 6 entrées garde exactement 4 lignes et retourne `4`.
- ✅ Le fichier élagué se revérifie comme `(True, 4)`.
- ✅ Les comptages après élagage ne reflètent que les lignes survivantes.

**🤔 Question(s) socratique(s)**

- La rétention garde les N entrées les plus récentes et se ré-ancre à `GENESIS`. Une exigence réglementaire pourrait vouloir « gardé 90 jours puis supprimé » — qu'est-ce que « supprimé » *signifie* pour une chaîne censée être append-only, et qui reçoit une copie avant l'élagage ?
- Après l'élagage, la liste des survivantes commence à `WARN retry #1` — les événements `INFO login ok` ont disparu du résumé aussi. Voudrais-tu une entrée *marqueur de rétention* (« deux événements INFO élagués le 2025-06-08 ») écrite dans le journal, et que ferait-elle à la chaîne ?

## Étape 5 : Export de conformité

Les journaux d'audit sont consommés — par des tableaux de bord, des SIEM, des feuilles de calcul. L'Étape 5 exporte le journal comme des données qu'un consommateur peut utiliser, plus un résumé lisible par un humain.

### 5.1 Exporte du JSONL

**👟 Indice de départ :** Écris `export_jsonl()` retournant un objet JSON par ligne, champs intacts.

```python
# main.py (continued)
    def export_jsonl(self):
        lines = []
        for row in self.rows():
            lines.append(json.dumps({"seq": int(row[0]), "ts": row[1],
                                     "severity": row[2], "source": row[3],
                                     "message": row[4]}))
        return lines

for line in fresh.export_jsonl():
    print(line)
```

JSON Lines (`.jsonl`) est le format d'échange que les tableaux de bord et les agrégateurs de journaux attendent : un objet JSON auto-descriptif par ligne, chaque ligne un événement complet. Exporté *après* validation (Étape 4.2), il représente « le contenu auquel nous faisons confiance », séparé du format de ligne brute dans lequel vit la chaîne — l'export est l'interface, la chaîne est le garde-fou.

**🎯 Résultat attendu :**

```
{"seq": 3, "ts": "2025-06-01T10:02:00", "severity": "WARN", "source": "payments", "message": "retry #1"}
{"seq": 4, "ts": "2025-06-01T10:03:00", "severity": "ERROR", "source": "payments", "message": "charge declined"}
{"seq": 5, "ts": "2025-06-01T10:04:00", "severity": "ERROR", "source": "net", "message": "timeout"}
{"seq": 6, "ts": "2025-06-01T10:05:00", "severity": "WARN", "source": "payments", "message": "charge recovered"}
```

**🩹 Si ça ne marche pas :** Si `message` montre un hachage de 64 caractères au lieu du texte, tu as exporté `row[5]`/`row[6]` (les champs de chaîne) au lieu de `row[4]`. Si `json.dumps` renvoie une erreur, un champ contient une non-chaîne (tous les champs sont des chaînes ici — vérifie que `seq` est d'abord converti en `int`).

### 5.2 Le résumé humain

**👟 Indice de départ :** Affiche un court résumé de conformité : nombre d'événements, totaux par source et par sévérité, et le verdict de vérification.

```python
# main.py (continued)
def summary(log):
    rows = log.rows()
    verdict, span = log.verify()
    return f"SIGNALS on {log.path.name}: verified={verdict} events={span} " \
           f"severities={dict(Counter(r[2] for r in rows))}"

print(summary(fresh))
```

Une ligne qu'un réviseur de conformité peut citer : « verified=True, events=4, severities=… ». Relier le *verdict* dans la même chaîne que les comptages empêche le tableau de bord de montrer des chiffres que la chaîne ne cautionnerait pas — l'export et la déclaration de confiance voyagent ensemble.

**🎯 Résultat attendu :** `SIGNALS on audit2.log: verified=True events=4 severities={'WARN': 2, 'ERROR': 2}`.

**🩹 Si ça ne marche pas :** Si `verified=False`, l'export a tourné sur un fichier falsifié/mal ré-ancré après rétention. Reconstruis le journal (restauration de l'Étape 2.3) et relance — le résumé n'est aussi honnête que la chaîne.

### 5.3 Vérifie l'export

**✅ Liste de vérification**

- ✅ `export_jsonl()` émet 4 lignes pour le journal conservé, messages intacts.
- ✅ La ligne de résumé accouple `verified=True` avec les comptages dans une même chaîne.
- ✅ Faire l'aller-retour du JSONL (`json.loads`) reproduit exactement les champs de données des lignes.

**🤔 Question(s) socratique(s)**

- L'export alimente un tableau de bord ; la chaîne prouve le fichier depuis lequel il a été exporté. Un consommateur qui n'a vu que la sortie de `export_jsonl()` n'a pas de chaîne — qu'expédierais-tu à côté du JSONL pour qu'un SIEM en aval puisse le vérifier, sans expédier tout ton codebase ?
- `summary` signale `events=4` et `verified=True` ensemble. Si la vérification échouait, préférerais-tu que le résumé affiche `None` pour les comptages, les affiche quand même avec un avertissement, ou refuse de s'exécuter ? Défends ton choix avec un public de conformité en tête.

## ⚠️ Pièges courants

- **Slice de payload décalée d'un.** `row[:4]` laisse tomber le message et chaque hachage recalculé est en désaccord silencieux avec ce que `append` a écrit. Le payload fait toujours cinq champs (`[:5]`) ; les champs de chaîne sont `row[5]` (prev) et `row[6]` (hachage).
- **Mode `"w"` sur le journal vivant.** Un seul drapeau `open` de travers efface la chaîne en pleine action. Réserve `"w"` pour `retain` et les reconstructions ; les ajouts en direct doivent être en `"a"`.
- **Élaguer sans ré-ancrer.** Tronquer le fichier mais laisser le `prev` des survivantes pointer vers des lignes supprimées fait échouer la vérification de la chaîne. Recalcule `prev`/hachage depuis `GENESIS` pendant que tu réécris, comme le fait `retain`.
- **Des hachages qui incluent le temps.** `digest(str(time.time()), …)` rend chaque vérification non déterministe. Les horodatages fixes du guide gardent les chaînes reproductibles ; si tu journalises les temps d'horloge murale, ils doivent être des *champs stables* — écrits une fois, hachés — pas recalculés au moment de la vérification.
- **Interroger les mauvais numéros de champ.** Les champs sont `[0]=seq [1]=ts [2]=severity [3]=source [4]=message [5]=prev [6]=hash`. Filtrer sur `row[1]` filtre les horodatages, pas les sévérités.
- **Exporter les champs de chaîne comme données.** Envoyer `row[5]`/`row[6]` à un tableau de bord fuit les hachages dans la colonne message. Exporte seulement `row[:5]`.

## Ce que tu viens de construire

Un journal d'audit inviolable, requêtable et rétentible : des lignes d'événements en append-only, une chaîne de hachage ancrée à `GENESIS`, un `verify()` qui pointe l'entrée exacte falsifiée, des filtres plus des comptages de sévérité, un élagage de rétention qui ré-ancre la chaîne, et un export de conformité JSONL dont le résumé porte le verdict de vérification. L'idée centrale est que *l'intégrité d'un audit est une propriété de conception, pas une attitude* : tu ne promets pas de ne pas maquiller le journal, tu rends le maquillage **détectable** en chaînant chaque entrée à son prédécesseur et en recalculant le maillon à la demande. Ce seul truc — un hachage par ligne, y compris le hachage précédent — est la même forme utilisée par les blockchains, git et les manifests de sauvegarde dédupliqués, parce que le graphe d'objets est petit et la preuve bon marché.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/audit-logger/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/audit-logger) dans le dépôt du cours est le journal complet comme notebook — ajout, vérification, démo de falsification, filtres, rétention et export JSONL, exécutables dans Colab/Kaggle/Binder. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute de l'intégrité de style HMAC : signe le hachage de chaque entrée avec une clé secrète (via `hmac.new`) pour que seuls les détenteurs de clé puissent écrire des entrées valides — les manœuvres en coulisses d'initiés sont alors attrapées aussi, pas seulement les éditions accidentelles.
- Expédie le JSONL vers un fichier avec `.write_text("\n".join(export_jsonl()))` et un tableau de bord qui l'ingère, traçant le nombre d'`ERROR` par heure à partir du champ `ts`.
- Implémente `tamper_demo()` comme une étape qui retourne au hasard un caractère dans le journal, revérifie, et affiche quelle entrée s'est cassée — un auto-test intégré pour la classe.
- Relie la rétention à une date (`retain_since("2025-06-01T10:03:00")`) et journalise une entrée *marqueur* `RETENTION` à chaque élagage, pour que l'historique supprimé soit lui-même mis en évidence.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier·e ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README contient un tutoriel complet, accessible aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, étape par étape. Aucune expérience git préalable n'est requise.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓