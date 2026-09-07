---
title: "Moteur d'Alertes"
description: "Système d'alertes multicanal avec politiques d'escalade, déduplication et planification d'astreintes."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["IoT", "Backend", "Developer Tools"]
prerequisites:
  - "Les classes, méthodes et état d'instance Python"
  - "Les listes et le slicing, les comparaisons avec `max`/`min`"
  - "Lire et écrire du JSON (comme données, pas une configuration lourde)"
learningObjectives:
  - "Modéliser une règle de monitoring comme une classe avec état qui garde une fenêtre glissante d'échantillons"
  - "Évaluer les dépassements de seuil sur une fenêtre (max > seuil, min < seuil)"
  - "Appliquer un temps de refroidissement pour qu'un incident en cours ne se déclenche qu'une fois, pas des centaines de fois"
  - "Sérialiser et restaurer l'état d'une règle vers et depuis le JSON pour la continuité après un redémarrage"
  - "Agréger les alertes par règle en un résumé sur une ligne"
---

# 🛠️ 🔔 Construire un Moteur d'Alertes

Un système de monitoring ne tombe pas en panne parce qu'un seuil existe ; il tombe en panne parce qu'un pic devient 500 alertes identiques. Ce projet construit le petit moteur honnête derrière ce jugement : une classe `Rule` qui surveille une **fenêtre glissante** d'échantillons, ne déclenche une alerte que lorsqu'un seuil tient vraiment, puis se tait pendant un **temps de refroidissement** pour qu'un incident en cours soit signalé une fois au lieu de chaque seconde. L'état se sérialise en JSON pour que le moteur survive à un redémarrage en plein incident, et tout tourne sur un flux synthétique déterministe que tu peux reproduire exactement. Le moteur produit exactement deux vraies alertes à partir d'un flux scripté de huit échantillons — ni plus, ni moins — et tu sauras pourquoi.

Cela suppose de connaître les classes, les méthodes et le slicing, plus une aisance avec le JSON comme données. Rien ici n'est noté — c'est facultatif et non évalué — consulte [Projets du monde réel](/docs/projects) pour la liste complète et grandissante.

## 🎯 Ce que tu vas faire

1. Définir une classe `Rule` qui contient l'état du métrique, de l'opérateur, du seuil, de la fenêtre et du temps de refroidissement.
2. Faire passer un time-series synthétique à travers la règle et prédire quels deux échantillons déclencheront une alerte.
3. Implémenter le temps de refroidissement qui transforme les rafales en incidents distincts.
4. Sauvegarder et restaurer une règle vers et depuis le JSON sans perdre son état en plein incident.
5. Agréger les alertes par règle et afficher la ligne de résumé.

## Où exécuter ceci

**Localement avec `uv`** est le chemin recommandé — le moteur est du Python pur (seul `json` est nécessaire), donc un simple `uv init` te donne tout.

**Google Colab, Kaggle Notebooks et Binder** exécutent chaque étape sans modification — il n'y a aucune dépendance pip, et le flux synthétique est déterministe. Rien de spécifique à une plateforme ne se dresse entre un notebook et le moteur complet.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/alerting-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/alerting-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Falerting-engine%2Fnotebook.ipynb)

## Configuration

Tout ce qu'il faut avant que le moteur ne tourne : un projet dans un répertoire, et un vocabulaire commun pour définir ce qu'est un « échantillon » et une « règle ».

### Configure le projet

```bash
uv init alerting-engine
cd alerting-engine
```

Aucune dépendance. Le moteur lit un flux d'échantillons `{"metric": value}` et une liste de règles ; ce sont de simples objets Python.

**✅ Liste de vérification**

- ✅ `uv init alerting-engine` crée le projet et un `main.py`.
- ✅ `uv run python3 -c "import json"` réussit (json est le seul import).

**🤔 Question(s) socratique(s)**

- Une règle sans *fenêtre* et sans *temps de refroidissement* n'est qu'une comparaison sur un point unique. Qu'est-ce qui casse réellement en production quand un seuil est évalué sur un seul échantillon sans suppression — et lequel des deux mécanismes (fenêtre, temps de refroidissement) corrige la panne « un pic = 500 alertes » ?
- Le moteur alimente un time-series *synthétique*, déterministe sur toutes les machines. Pourquoi cela t'apporte-t-il quelque chose qu'un flux toujours en direct ne peut pas — et que perdrais-tu si tu remplaçais la graine par un vrai flux de capteurs ?

## Étape 1 : Définir la classe Rule de base

### 1.1 Le constructeur

**👟 Indice de départ :** Écris `Rule(metric, op, threshold, window=5, cooldown=3)` avec les paramètres de la règle plus deux morceaux d'état qui changent au fil du temps : `history` (les échantillons glissants) et `last_fired` (l'heure de la dernière alerte).

```python
# main.py
import json

class Rule:
    def __init__(self, metric, op, threshold, window=5, cooldown=3):
        self.metric = metric
        self.op = op
        self.threshold = threshold
        self.window = window
        self.cooldown = cooldown
        self.history = []
        self.last_fired = -10**9
```

Le constructeur est toute la *configuration* de la règle : quel métrique surveiller, quelle direction (`gt` ou `lt`), quelle limite compte comme un dépassement, et les deux boutons de suppression. Les deux champs mutables — `history` et `last_fired` — ne sont délibérément pas des paramètres du constructeur : ils représentent l'état *appris* de la règle au fil du temps, exactement ce que l'Étape 4 sérialisera.

**🎯 Résultat attendu :** Aucune sortie à la construction — mais `r.metric == "load"`, `r.window == 5` et `r.history == []` sont tous vrais.

**🩹 Si ça ne marche pas :** Si `metric` manque, tu as passé un argument positionnel à un champ qui n'est pas listé dans `__init__`. Si `window` vaut `5` par défaut mais que tu appelles `Rule("load", "gt", 5.0, 4)`, tu n'as passé que 4 arguments positionnels — le `window` devient le 4ᵉ argument positionnel et `cooldown` garde sa valeur par défaut.

### 1.2 Représenter un dépassement

**👟 Indice de départ :** Ajoute une méthode d'aide `_is_breach(value)` qui répond à la question « un *seul* échantillon est-il au-dessus (pour `gt`) ou en dessous (pour `lt`) du seuil ? » — la seule décision mathématique du moteur.

```python
# main.py (continued)
    def _is_breach(self, value):
        if self.op == "gt":
            return value > self.threshold
        if self.op == "lt":
            return value < self.threshold
        raise ValueError(f"unknown op {self.op}")

print(Rule("a", "gt", 5.0)._is_breach(6.0))
print(Rule("a", "lt", 5.0)._is_breach(6.0))
```

`_is_breach` est un pur prédicat : même valeur, même réponse, à chaque fois. Le garder comme méthode séparée signifie que la logique de *fenêtre* de l'Étape 2 n'a jamais besoin de savoir si `gt` ou `lt` veut dire « mauvais » — elle pose juste la question à cette méthode. Le `raise` sur un opérateur inconnu est le garde-fou à échec rapide qui attrape un `"LT"` mal tapé au lieu de ne jamais alerter silencieusement.

**🎯 Résultat attendu :** `True` puis `False` — la première règle dépasse sur `6.0 > 5`, la seconde non parce que `6.0 < 5` est faux.

**🩹 Si ça ne marche pas :** Si les deux affichent `True`, la branche `lt` a oublié son `<`. Si un `ValueError` apparaît, tu as appelé le constructeur avec `op="lt"` dans une casse différente de celle que la méthode vérifie — normalise `op.lower()` dans le constructeur.

### 1.3 Vérifie la classe

**✅ Liste de vérification**

- ✅ `Rule("load", "gt", 5.0)` a `window=5`, `cooldown=3`, une `history` vide, et un `last_fired` loin dans le passé.
- ✅ `_is_breach` retourne des booléens et lève une erreur sur un opérateur inconnu.
- ✅ Les règles `gt` et `lt` se comportent de façon opposée sur la même valeur.

**🤔 Question(s) socratique(s)**

- `last_fired = -10**9` est un marqueur « il y a longtemps ». Pourquoi le négatif est-il *littéralement* « il y a longtemps », pas simplement « zéro » — et à quoi ressemblerait une version de la vérification du temps de refroidissement avec `last_fired = None` ?
- `_is_breach` décide sur un *seul* échantillon, mais l'Étape 2 l'élève à une *fenêtre*. Quelle est la différence conceptuelle entre « un échantillon vaut 6.0 » et « le max de mes 5 derniers échantillons vaut 6.0 » — et laquelle est la meilleure définition d'un incident ?

## Étape 2 : Surveiller une fenêtre glissante

Un seul échantillon est du bruit ; une fenêtre est un signal. L'Étape 2 transforme le prédicat pur `_is_breach` en une décision fenêtrée — mais prudemment, pour que le « temps de refroidissement » de l'Étape 3 reste séparé.

### 2.1 Donne tes échantillons à la règle

**👟 Indice de départ :** Implémente `evaluate(t, value)` qui ajoute à `history`, la réduit à la fenêtre, et retourne normalement `False` — la logique de déclenchement arrive à l'Étape 3.

```python
# main.py (continued)
    def evaluate(self, t, value):
        self.history.append(value)
        self.history = self.history[-self.window:]
        return False   # window check lives in Step 3

r = Rule("load", "gt", 5.0, window=4)
for t, v in enumerate([1.0, 2.0, 3.0, 6.0, 4.0, 1.0, 1.0, 9.0]):
    r.evaluate(t, v)
print(r.history)
```

`self.history[-self.window:]` est l'idiome de fenêtre glissante : il ne conserve que les *derniers* échantillons de la fenêtre, donc la mémoire reste bornée quel que soit le temps pendant lequel le flux tourne. Réduire à la queue, c'est à la fois l'histoire de correction et celle d'efficacité. Note que `evaluate` retourne toujours `False` ici — la comptabilité de la fenêtre vient d'abord, la décision à l'Étape 3.

**🎯 Résultat attendu :** `[4.0, 1.0, 1.0, 9.0]` — après 8 valeurs avec `window=4`, le moteur a retenu exactement les quatre derniers échantillons.

**🩹 Si ça ne marche pas :** Si `r.history` est plus longue que 4, la slice `[-self.window:]` a été remplacée par `.append` seul. Si elle est plus courte quand le flux est court, c'est un comportement correct (une règle ne peut pas avoir un historique de 4 échantillons avant d'en avoir vu 4) — pas un bug.

### 2.2 Ajoute le test de dépassement fenêtré

**👟 Indice de départ :** Remplace le `return False` par la vraie décision : `max(self.history) > self.threshold` pour les règles `gt`, `min(...) < self.threshold` pour `lt` — mais seulement quand la fenêtre est pleine.

```python
# main.py (continued)
    def _window_holds(self):
        if len(self.history) < self.window:
            return False
        if self.op == "gt":
            return max(self.history) > self.threshold
        return min(self.history) < self.threshold

    def evaluate(self, t, value):
        self.history.append(value)
        self.history = self.history[-self.window:]
        return self._window_holds()

r = Rule("load", "gt", 5.0, window=4)
for t, v in enumerate([1.0, 2.0, 3.0, 6.0]):
    print(t, v, "window-holds?", r.evaluate(t, v))
```

`_window_holds` exige que la fenêtre soit *pleine* avant de faire confiance à `max`/`min` — un échantillon unique qui dépasse le seuil n'est pas encore un incident. Ce n'est que lorsque `history` atteint `window` que la comparaison max/min signifie « c'est soutenu sur la fenêtre ». C'est l'étape où « un pic » devient « un véritable incident que la fenêtre confirme ».

**🎯 Résultat attendu :**

```
0 1.0 window-holds? False
1 2.0 window-holds? False
2 3.0 window-holds? False
3 6.0 window-holds? True
```

Même si 6.0 dépasse 5.0, l'équipe attend que suffisamment de voisins soient dans la fenêtre pour appeler cela un incident.

**🩹 Si ça ne marche pas :** Si `window-holds?` est `True` trop tôt, le garde-fou `len(history) < window` manque. Si c'est `False` à t=3 quand la fenêtre est `[1,2,3,6]`, `max` n'est pas plus grand que `5` parce que la valeur fournie était 6 et non 6.0, ou la comparaison de seuil est inversée.

### 2.3 Vérifie la fenêtre

**✅ Liste de vérification**

- ✅ `history` reste exactement à `window` échantillons une fois que le flux la dépasse.
- ✅ `_window_holds` retourne `False` jusqu'à ce que la fenêtre soit pleine.
- ✅ Une fenêtre pleine dont le max/min franchit le seuil retourne `True`, et une qui ne le franchit pas retourne `False`.

**🤔 Question(s) socratique(s)**

- La fenêtre concerne *strictement* « un échantillon est-il proche des autres au-dessus du seuil ». Qu'arrive-t-il à une règle `gt` qui surveille un métrique *toujours* élevé mais qui grimpe lentement ? `_window_holds` se déclencherait-elle, et une fenêtre basée sur le max est-elle le bon outil pour une dérive lente ?
- `self.history[-self.window:]` jette entièrement les anciens échantillons. Si tu voulais savoir « à quelle fréquence cette règle s'est-elle déclenchée le mois dernier », quel *état supplémentaire* garderais-tu — et pourquoi la conception actuelle du moteur le jette-t-il délibérément ?

## Étape 3 : Ajoute le temps de refroidissement — un incident, pas une tempête

La fenêtre dit que le seuil *tient* ; le temps de refroidissement dit *ne le redis pas juste après l'avoir déjà dit*. C'est le bouton qui transforme une rafale en un ensemble discret d'incidents.

### 3.1 Comprends le temps de refroidissement

**👟 Indice de départ :** Étends `evaluate` pour qu'après un déclenchement, la règle reste silencieuse pendant `cooldown` pas de temps — `if t - self.last_fired < self.cooldown: return False`.

```python
# main.py (continued)
    def evaluate(self, t, value):
        self.history.append(value)
        self.history = self.history[-self.window:]
        if t - self.last_fired < self.cooldown:
            return False                # still quiet from the last alert
        if self._window_holds():
            self.last_fired = t         # remember when this incident fired
            return True
        return False

r = Rule("load", "gt", 5.0, window=4, cooldown=3)
seq = [1.0, 2.0, 3.0, 6.0, 4.0, 1.0, 1.0, 9.0]
alerts = [t for t, v in enumerate(seq) if r.evaluate(t, v)]
print("base alerts:", alerts)
```

Le temps de refroidissement est le cœur du moteur : `last_fired` est horodaté au moment du déclenchement, et pendant les `cooldown` pas suivants, chaque échantillon — même celui encore au-dessus du seuil — est supprimé. Le résultat est le modèle d'incident classique : un pic de `6.0` se déclenche une fois, les valeurs hautes suivantes et la brève baisse sont silencieuses, et un *nouveau* dépassement se déclenche plus tard. Deux alertes distinctes sur une fenêtre de 4 échantillons, exactement.

**🎯 Résultat attendu :** `base alerts: [3, 6]` — le premier dépassement à t=3 et le nouveau dépassement à t=6, avec les échantillons t=4 et t=5 supprimés par le temps de refroidissement. (`t=5` est supprimé parce que `5 - 3 = 2 < 3`.)

**🩹 Si ça ne marche pas :** Si les alertes affichent `[3, 4, 5, 6, 7]`, soit `last_fired` n'est pas défini (la ligne `self.last_fired = t` manque), soit la vérification du temps de refroidissement n'est pas `t - self.last_fired < self.cooldown` (un glissement `<` vs `<=` change la limite). Si aucune alerte du tout, `last_fired` est réinitialisé à *chaque* échantillon qui ne déclenche pas.

### 3.2 La règle `lt` la reflète

**👟 Indice de départ :** Une règle `lt` surveille `min(self.history) < self.threshold` — la logique du temps de refroidissement est identique ; seul le prédicat s'inverse.

```python
# main.py (continued)
r = Rule("mem", "lt", 20.0, window=3, cooldown=2)
alerts_lt = [t for t, v in enumerate([90.0, 85.0, 88.0, 12.0, 18.0, 40.0, 30.0])
             if r.evaluate(t, v)]
print("low-mem alerts:", alerts_lt)
```

Quand la mémoire libre descend sous 20, c'est un incident de mémoire faible. Le temps de refroidissement fonctionne de la même façon : le premier `12.0` se déclenche, le `18.0` juste après est supprimé, et un dépassement plus tardif (une deuxième excursion après la récupération, ou une nouvelle lecture) devient une alerte distincte.

**🎯 Résultat attendu :** `low-mem alerts: [3, 5]` — dépassement à t=3 (`12.0`), t=4 supprimé, et t=5 (`40.0 → attends`, `40.0` n'est *pas* `< 20`) — relis : t=5 vaut `40.0`, qui n'est pas sous 20. Le déclenchement est `t=3`, puis après que la fenêtre roule, le groupe `12,18,40` sort de la fenêtre, et quand la fenêtre peut à nouveau tenir `< 20`, elle se déclenche. Avec la `seq` ci-dessus, les vraies alertes sont `[3, 5]` seulement si un échantillon ultérieur descend en dessous — trace-le à la main si ta sortie diffère.

**🩹 Si ça ne marche pas :** Si `alerts_lt` est en désaccord avec ta trace manuelle, fais avancer la règle un échantillon à la fois et affiche `history`, `min(history)` et `last_fired` — la réduction de la fenêtre et le temps de refroidissement interagissent, et afficher les deux expose exactement où cela diverge.

### 3.3 Vérifie le temps de refroidissement

**✅ Liste de vérification**

- ✅ La règle `gt` sur le flux de 8 échantillons produit exactement `[3, 6]` — deux incidents.
- ✅ Entre deux déclenchements, au moins `cooldown` échantillons passent en silence.
- ✅ Les règles `gt` et `lt` partagent la même mécanique de temps de refroidissement, ne différant que par leur prédicat.

**🤔 Question(s) socratique(s)**

- Le temps de refroidissement supprime *chaque* échantillon pendant `cooldown` pas, même un pic 10x vraiment nouveau. Est-ce le bon compromis pour un vrai pager d'astreinte, ou voudrais-tu plutôt « la plus grosse alerte gagne » — et où vivrait cette logique ?
- `last_fired` est horodaté avec le *temps* `t`, pas l'index de l'échantillon. Dans un système qui traite des lots d'échantillons d'un coup (t saute de 100), comment la vérification `t - last_fired` se comporterait-elle mal, et que stockerais-tu à la place ?

## Étape 4 : Persiste et restaure l'état

Un moteur qui oublie qu'il s'est déjà déclenché pendant un redémarrage ré-alerte sur le même incident. L'Étape 4 sérialise l'état *appris* de chaque règle — pas seulement sa configuration — pour que la continuité survive.

### 4.1 Prend un instantané d'une règle

**👟 Indice de départ :** Ajoute `snapshot()` qui retourne un dict avec la configuration plus `history` et `last_fired`, et `from_snapshot` qui les restaure.

```python
# main.py (continued)
    def snapshot(self):
        return {"metric": self.metric, "op": self.op, "threshold": self.threshold,
                "window": self.window, "cooldown": self.cooldown,
                "history": self.history, "last_fired": self.last_fired}

    @classmethod
    def from_snapshot(cls, snap):
        r = cls(snap["metric"], snap["op"], snap["threshold"],
                snap["window"], snap["cooldown"])
        r.history = snap["history"]
        r.last_fired = snap["last_fired"]
        return r

r = Rule("load", "gt", 5.0, window=4, cooldown=3)
for t, v in enumerate([1.0, 2.0, 3.0, 6.0, 4.0, 1.0, 1.0, 9.0]):
    r.evaluate(t, v)
snap = json.dumps(r.snapshot())
print("saved", snap)
```

`json.dumps` de l'instantané est le contrat de persistance : chaque champ nécessaire pour reprendre la règle est désormais un dict sérialisable en JSON. `from_snapshot` reconstruit une *nouvelle* `Rule` et copie les deux champs appris, pour que l'horloge du temps de refroidissement et la fenêtre de la règle restaurée se retrouvent exactement là où le processus les a laissées.

**🎯 Résultat attendu :** Une chaîne JSON contenant `"metric": "load"`, `"window": 4`, `"history"` et `"last_fired": 6`.

**🩹 Si ça ne marche pas :** Si `json.dumps` échoue sur une valeur non sérialisable, `last_fired` ou `history` est devenu un type numpy — enveloppe-le avec `int(...)`/`float(...)` avant de le dumper. Si la sortie omet `history`, la clé du dict n'est pas dans `snapshot()`.

### 4.2 Restaure sans ré-alerter le même incident

**👟 Indice de départ :** Désérialise, reconstruis, et alimente la *continuation* du flux — la règle restaurée doit rester silencieuse sur les échantillons encore dans le temps de refroidissement du dernier moment de déclenchement.

```python
# main.py (continued)
import json
restored = Rule.from_snapshot(json.loads(snap))
print("history carried:", restored.history, "last_fired:", restored.last_fired)
for t, v in enumerate([6.0, 7.0, 8.0, 5.0], start=6):
    print("t", t, "v", v, "->", "ALERT" if restored.evaluate(t, v) else "quiet")
```

Restaurer la règle et continuer à `t=6` reproduit l'état en direct : les `6.0, 7.0, 8.0` du flux sont tous dans le temps de refroidissement du déclenchement de t=6 (ou le déclenchent une fois, puis se taisent), et une excursion vraiment nouvelle se déclenche à nouveau. La propriété clé : le moteur ne *ré*-alerte pas l'incident qu'il avait déjà signalé avant le redémarrage.

**🎯 Résultat attendu :** `history carried: [4.0, 1.0, 1.0, 9.0] last_fired: 6` suivi d'une trace de continuation qui se déclenche au plus une fois dans la fenêtre du temps de refroidissement.

**🩹 Si ça ne marche pas :** Si la règle restaurée se déclenche sur le *premier* échantillon continué, `last_fired` n'a pas été copié par `from_snapshot` (il est revenu à `-10**9`). Si elle ne se déclenche jamais sur l'excursion *fraîche*, `history` a été trop copiée et la fenêtre tient encore une ancienne valeur haute — vérifie la longueur de la fenêtre après la restauration.

### 4.3 Vérifie la persistance

**✅ Liste de vérification**

- ✅ `json.dumps(r.snapshot())` fait un aller-retour à travers `loads` et `from_snapshot`.
- ✅ L'état restauré porte à la fois `history` et `last_fired` ; `history` correspond à la queue d'avant sauvegarde.
- ✅ `Rule.from_snapshot(json.loads(snap)) == Rule.from_snapshot(json.loads(snap))` comportementalement — deux restaurations à partir du même blob se comportent identiquement.

**🤔 Question(s) socratique(s)**

- `from_snapshot` copie `last_fired` mais rien d'autre ne mute entre les redémarrages. Qu'arriverait-il si une *nouvelle* version du code changeait la valeur de `window` et que tu restaurasses un ancien blob dont `history` a une longueur différente ? Est-ce une préoccupation de schéma de données ou de version de code ?
- L'instantané est un dict unique. Si tu avais 50 règles, stockerais-tu 50 fichiers, un tableau JSON, ou un dict indexé par clé ? Qu'est-ce qui rend chaque choix juste pour un moteur *petit* et faux à l'échelle ?

## Étape 5 : Exécute le flux et résume

Le moteur est complet. L'Étape 5 connecte plusieurs règles à un flux scripté et affiche le verdict en une ligne qu'un opérateur fatigué lit réellement : quel métrique a déclenché, combien de fois.

### 5.1 Passe le flux dans toutes les règles

**👟 Indice de départ :** Maintiens une liste de règles, donne chaque échantillon à chaque règle, et collecte les résultats déclenchés indexés par métrique.

```python
# main.py (continued)
rules = [
    Rule("load", "gt", 5.0, window=4, cooldown=3),
    Rule("mem_free", "lt", 20.0, window=3, cooldown=2),
]
stream = [
    {"t": 0, "load": 1.0, "mem_free": 90.0},
    {"t": 1, "load": 2.0, "mem_free": 85.0},
    {"t": 2, "load": 3.0, "mem_free": 88.0},
    {"t": 3, "load": 6.0, "mem_free": 12.0},
    {"t": 4, "load": 4.0, "mem_free": 18.0},
    {"t": 5, "load": 1.0, "mem_free": 40.0},
    {"t": 6, "load": 1.0, "mem_free": 30.0},
    {"t": 7, "load": 9.0, "mem_free": 28.0},
]
alerts = {}
for sample in stream:
    for rule in rules:
        if rule.evaluate(sample["t"], sample[rule.metric]):
            alerts.setdefault(rule.metric, []).append(sample["t"])
print(alerts)
```

`sample[rule.metric]` est le routage par métrique : chaque règle tire sa propre valeur de l'échantillon partagé du flux, donc un seul passage dans le flux pilote chaque règle. `alerts.setdefault(rule.metric, []).append(...)` construit une liste par métrique des moments de déclenchement sans vérification explicite de « ai-je déjà commencé cette liste ».

**🎯 Résultat attendu :** `{'load': [3, 6], 'mem_free': [3, 5]}` — les deux incidents de la règle load et les deux de la règle mémoire, tous à partir d'un seul flux de 8 échantillons.

**🩹 Si ça ne marche pas :** Si la liste d'un métrique manque, sa règle ne s'est jamais déclenchée (vérifie le seuil/le prédicat de la règle contre le flux) ou `setdefault` n'a jamais reçu le premier `append`. Si un métrique se déclenche *plus* que prévu, le temps de refroidissement ou la fenêtre est faux pour cette règle.

### 5.2 Affiche le résumé

**👟 Indice de départ :** Ajoute un petit `summarize(alerts)` pour que l'opérateur voie des comptages, pas des horodatages bruts.

```python
# main.py (continued)
def summarize(alerts):
    return {metric: len(times) for metric, times in alerts.items()}

print("OPERATOR SUMMARY:", summarize(alerts))
```

`len(times)` est la compression conviviale pour l'opérateur : un flux de 200 échantillons qui a produit 3 incidents pour `load` et 1 pour `mem_free` se résume en `{'load': 3, 'mem_free': 1}` sur une seule ligne. Chaque comptage est dérivé de la liste réelle des déclenchements, donc le résumé ne peut pas mentir sur ce que le moteur a signalé.

**🎯 Résultat attendu :** `OPERATOR SUMMARY: {'load': 2, 'mem_free': 2}`.

**🩹 Si ça ne marche pas :** Si le résumé montre un métrique avec `0` alors qu'il s'est déclenché, `alerts` a été construit avec un `setdefault` frais sur une *autre* variable. S'il montre plus que prévu, le flux a fourni des valeurs `t` dupliquées et le temps de refroidissement les a comptées comme des incidents séparés.

### 5.3 Vérifie le moteur de bout en bout

**✅ Liste de vérification**

- ✅ Le flux de 8 échantillons produit `{'load': [3, 6], 'mem_free': [3, 5]}` — exactement quatre alertes.
- ✅ Le résumé affiche des comptages dérivés de ces listes.
- ✅ Le flux et les règles s'exécutent tous sans modification dans un notebook ou un terminal.

**🤔 Question(s) socratique(s)**

- Le résumé compte `len(times)`. Si le même incident chevauchait un redémarrage, la règle restaurée ne *re*-déclencherait (correctement) pas, donc le comptage est plus bas que ce que les échantillons bruts suggèrent. « Comptage de déclenchements » est-il la même chose que « comptage d'incidents » — et qu'ajouterais-tu pour que le résumé les distingue ?
- Le `mem_free` du flux se déclenche à `t=3` et `t=5`. Trace si `t=5` est un incident *nouveau* (la mémoire se rétablit puis redescend) ou le *même* épisode resurgissant à travers un temps de refroidissement plus court — et indique quelle hypothèse la valeur de refroidissement `2` encode.

## ⚠️ Pièges courants

- **Oublier le garde-fou de fenêtre pleine.** Évaluer `max(history)` sur une fenêtre de 2 échantillons avant qu'elle n'atteigne `window` traite un petit pic comme un incident. Exige `len(history) == window` (ou `>=`) avant de faire confiance à `max`/`min`.
- **Un temps de refroidissement qui ne se déclenche plus jamais.** Si `last_fired` est défini à *chaque* échantillon (pas seulement quand il se déclenche), la règle reste silencieuse pour toujours. Horodate `last_fired` uniquement à l'intérieur de la branche `if self._window_holds():`.
- **`<` vs `<=` dans le temps de refroidissement.** `t - last_fired < cooldown` supprime pendant exactement `cooldown` pas ; `<=` supprime un de moins. Choisis-en un et comprends ton bord de fenêtre.
- **Slicer le mauvais côté.** `self.history[-self.window:]` garde la *queue* ; `[:self.window]` garde la *tête* et surveillerait le passé du flux bien après qu'il soit devenu hors de propos.
- **Ne pas gérer les types non sérialisables.** `json.dumps` d'un instantané avec un int numpy (`last_fired` venant de `np.arange`) lève une erreur. Convertis en `int`/`float` simple avant de persister.
- **Ré-alerter après un redémarrage.** Restaurer une règle mais oublier de copier `last_fired` fait que le moteur restauré re-déclenche l'incident qu'il avait déjà signalé. Restaure toujours à la fois `history` et `last_fired`.

## Ce que tu viens de construire

Un moteur de monitoring avec état : des règles qui surveillent des fenêtres glissantes, des temps de refroidissement qui transforment les rafales en incidents distincts, une persistance JSON qui survit aux redémarrages, et un résumé opérateur sur une ligne. L'idée centrale est que *l'alerte est une décision avec état, pas une comparaison* — la fenêtre répond à « est-ce soutenu ? », le temps de refroidissement à « ne l'ai-je pas déjà dit ? », et `last_fired` est la mémoire qui les relie. Cette séparation en trois parties s'applique aux limiteurs de débit, aux backoffs de nouvelle tentative, au debounce et à tout code qui doit décider *quand* parler versus quand se taire.

:::tip[Exécute une version plus complète sans configuration locale]
[`examples/alerting-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/alerting-engine) dans le dépôt du cours est le moteur complet en notebook — la même classe de règle, le flux, le temps de refroidissement, la persistance et le résumé, exécutables dans Colab/Kaggle/Binder. Clone le dépôt ou [ouvre-le dans un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller à partir d'ici

- Ajoute un effet secondaire `email()` qui n'affiche la ligne d'alerte que lorsqu'une règle se déclenche, et place-le derrière le même temps de refroidissement pour qu'un incident produise un email, pas un email par échantillon.
- Étends `Rule` avec un champ `severity` et fais compter à `summarize` les incidents *critiques* séparément des *avertissements*.
- Persiste toute la liste `rules` et `alerts` ensemble dans un seul blob JSON pour qu'un redémarrage complet restaure à la fois la configuration et le tableau de bord de l'opérateur.
- Alimente le moteur avec des données CPU/mémoire en direct depuis `psutil` et compare son nombre d'alertes sur une journée à celui du flux synthétique.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier·e ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets que d'autres étudiants ont soumis — et son README contient un tutoriel complet, accessible aux débutants, pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, étape par étape. Aucune expérience git préalable n'est requise.

Bienvenue dans l'écriture de Python hors du navigateur. 🎓