# OpenFox Community Registry

The official community registry for **OpenFox Packs**: share and discover workflows, agents, sub-agents, MCP servers, skills, and commands.

---

## 🚀 How to Install a Pack in OpenFox

In your OpenFox assistant, simply run:
```bash
hub_install { "source": "pr-code-reviewer" }
```
Or open the **Community Hub** tab in OpenFox Settings to browse and install packs with 1 click.

---

## 📦 How to Submit a Pack

1. In OpenFox, export your workflow using the `hub_export` tool:
   ```bash
   hub_export { "workflowId": "my-workflow", "name": "my-pack" }
   ```
2. Fork this repository and create a new file under `packs/<your-pack-name>.json`.
3. Add an entry to `index.json` under `packs`:
   ```json
   {
     "name": "my-pack",
     "version": "1.0.0",
     "displayName": "My Pack Display Name",
     "description": "Short description of what the pack does",
     "author": { "name": "Your Name", "url": "https://github.com/yourusername" },
     "tags": ["workflow", "tools"],
     "downloadUrl": "https://raw.githubusercontent.com/JamesDAdams/openfox-community/main/packs/my-pack.json"
   }
   ```
4. Open a Pull Request! Once merged, your pack is instantly available to all OpenFox users worldwide without any backend infrastructure.
