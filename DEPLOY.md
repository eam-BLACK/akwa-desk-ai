# HelpdeskOS — Guide de déploiement Netlify

## Déploiement en 3 étapes

### 1. Déployer sur Netlify

**Option A — Drag & Drop (le plus rapide)**
1. Allez sur https://app.netlify.com
2. Glissez-déposez le dossier `it-portal/` entier dans la zone de dépôt
3. Votre site est en ligne en 30 secondes

**Option B — GitHub (recommandé pour les mises à jour)**
1. Créez un dépôt GitHub avec le contenu du dossier `it-portal/`
2. Sur Netlify : "New site from Git" → sélectionnez votre dépôt
3. Build command : *(laisser vide)*
4. Publish directory : `.` (ou `it-portal/` selon structure)

---

### 2. Ajouter les variables d'environnement (API IA)

Allez dans : **Site settings → Environment variables → Add variable**

| Variable         | Description                           | Obligatoire |
|------------------|---------------------------------------|-------------|
| `GEMINI_API_KEY` | Clé API Google Gemini (IA principale) | Recommandé  |
| `GROQ_API_KEY`   | Clé API Groq (IA de secours)          | Optionnel   |

> **Sans API keys :** le chatbot fonctionne quand même avec la base de connaissance locale (30 problèmes IT). L'IA conversationnelle sera activée dès l'ajout des clés.

**Obtenir les clés :**
- Gemini : https://aistudio.google.com/apikey (gratuit)
- Groq   : https://console.groq.com/keys (gratuit)

---

### 3. Activer Netlify Blobs (persistance des données)

Netlify Blobs est **automatiquement activé** dès que votre site est déployé.
Aucune configuration supplémentaire n'est requise.

✅ Toutes les données (utilisateurs, tickets, modifications) sont désormais
   synchronisées entre tous les appareils.

---

## Architecture de la persistance

```
Appareil A                    Netlify                    Appareil B
   │                              │                            │
   ├─ Login ──────────────────────► syncFromServer()           │
   │                              │ (charge users+tickets)     │
   ◄─────────────── localStorage ─┤                            │
   │                              │                            │
   ├─ Crée ticket ───────────────►│ Netlify Blobs (/.netlify/  │
   │  (localStorage instantané)   │ functions/db) stocke tout  │
   │                              │                            │
   │                              │            Login ◄─────────┤
   │                              │   syncFromServer() ────────►
   │                              │                     trouve │
   │                              │                  le ticket ◄
```

**Logique :**
- Lecture → `localStorage` (instantané)
- Écriture → `localStorage` + sync serveur (fire-and-forget)
- Connexion → sync serveur → `localStorage` (données fraîches)

---

## Comptes par défaut

| Identifiant | Mot de passe | Rôle         |
|-------------|-------------|--------------|
| `admin`     | `admin`     | Super Admin  |

> Changez le mot de passe admin depuis : *Gestion Utilisateurs → Compte Super Admin*
