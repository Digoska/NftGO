# 📤 Git Setup - Upload na Private Repository

## ✅ Čo je hotové

- ✅ Git repo inicializovaný
- ✅ Všetky súbory pridané
- ✅ Initial commit vytvorený
- ✅ `.gitignore` nastavený (ignoruje `.env`, `node_modules`, atď.)

## 🚀 Upload na GitHub (Private Repo)

### Krok 1: Vytvor Private Repo na GitHub

1. Choď na [GitHub](https://github.com)
2. Klikni **New repository** (alebo **+** → **New repository**)
3. Nastav:
   - **Repository name:** `nft-go` (alebo čokoľvek chceš)
   - **Visibility:** **Private** 🔒
   - **NEZAČÍNAJ** s README, .gitignore, alebo licenciou (už máme)
4. Klikni **Create repository**

### Krok 2: Pridaj Remote a Push

GitHub ti ukáže inštrukcie. Spusti tieto príkazy:

```bash
# Pridaj remote (nahraď USERNAME a REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Alebo ak používaš SSH:
git remote add origin git@github.com:USERNAME/REPO_NAME.git

# Push na GitHub
git branch -M main
git push -u origin main
```

**Poznámka:** Ak používaš HTTPS, GitHub ti môže požiadať o autentifikáciu (Personal Access Token).

---

## 🔐 GitHub Authentication

### Personal Access Token (pre HTTPS)

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token (classic)**
3. Nastav:
   - **Note:** `nft-go repo`
   - **Expiration:** podľa potreby
   - **Scopes:** ✅ `repo` (full control of private repositories)
4. **Generate token**
5. **Skopíruj token** (zobrazí sa len raz!)
6. Pri `git push` použij token namiesto hesla

### SSH Key (odporúčané)

```bash
# Vytvor SSH key (ak ešte nemáš)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Skopíruj public key
cat ~/.ssh/id_ed25519.pub

# Pridaj na GitHub:
# Settings → SSH and GPG keys → New SSH key
```

---

## 📤 Upload na GitLab (Private Repo)

### Krok 1: Vytvor Private Project na GitLab

1. Choď na [GitLab](https://gitlab.com)
2. Klikni **New project** → **Create blank project**
3. Nastav:
   - **Project name:** `nft-go`
   - **Visibility:** **Private**
   - **NEZAČÍNAJ** s README
4. Klikni **Create project**

### Krok 2: Pridaj Remote a Push

```bash
# Pridaj remote (nahraď USERNAME a PROJECT_NAME)
git remote add origin https://gitlab.com/USERNAME/PROJECT_NAME.git

# Push na GitLab
git branch -M main
git push -u origin main
```

---

## 🔍 Overenie

Po pushnutí by si mal vidieť:

```bash
# Skontroluj remote
git remote -v

# Skontroluj status
git status
```

V GitHub/GitLab by si mal vidieť všetky súbory!

---

## 📝 Ďalšie Príkazy

### Pridanie zmien

```bash
# Pridaj zmeny
git add .

# Commit
git commit -m "Tvoja správa"

# Push
git push
```

### Ignorované súbory

Tieto súbory sa **NEUPLOADNÚ** (sú v `.gitignore`):
- `.env` - environment variables
- `node_modules/` - dependencies
- `assets/test/` - test assets
- `*.log` - log files
- `client_secret_*.json` - sensitive files

---

## ✅ Hotovo!

Tvoj projekt je teraz na private Git repozitári! 🎉

**Dôležité:**
- ✅ `.env` sa **NEUPLOADNE** (je v `.gitignore`)
- ✅ Sensitive files sa **NEUPLOADNÚ**
- ✅ Všetky dokumenty sú pridané
- ✅ README.md obsahuje všetky informácie

---

**Ak máš problémy, pozri GitHub/GitLab dokumentáciu alebo mi napíš!**

