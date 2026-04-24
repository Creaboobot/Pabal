# Manual Upload Instructions

## Goal

Upload this starter pack into the root of the GitHub repository:

```text
Creaboobot/Pobal
```

## Option A: GitHub web upload

1. Open the `Pobal` repository in GitHub.
2. Choose **Add file** → **Upload files**.
3. Drag the extracted contents of this ZIP into the upload area.
4. Commit directly to `main` only for this initial setup.
5. After the starter pack is committed, future changes should use branches and pull requests.

## Option B: Local Git upload

```bash
git clone https://github.com/Creaboobot/Pobal.git
cd Pobal
# copy extracted starter pack files into this folder
git add .
git commit -m "Add Codex-ready repository preparation files"
git push origin main
```

## After upload

Give Codex the prompt in:

```text
FIRST_CODEX_PROMPT.md
```

Do not ask Codex to build the full application in one step.
