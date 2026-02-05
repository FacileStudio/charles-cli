import { parseArgs } from "node:util";
import { intro, outro, note } from "@clack/prompts";
import { existsSync, mkdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { templates } from "./templates";
import { DOC_CONFIG, type DocType } from "./config";
import { loadYaml, compileTypst } from "./utils";
import { mapVariables, injectVariables } from "./processor";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    help: { type: "boolean", short: "h" },
    file: { type: "string", short: "f" },
    out: { type: "string", short: "o" },
  },
  strict: true,
});

async function main() {
  const configPath = values.file || (existsSync("./job.yml") ? "./job.yml" : null);
  if (!configPath) process.exit(1);

  const config = await loadYaml(configPath);
  if (!config) process.exit(1);

  intro(`🚀 CHARLES CLI - ${basename(configPath)}`);

  for (const type of (Object.keys(DOC_CONFIG) as DocType[])) {
    if (!config[type]) continue; // On ne traite que ce qui est coché dans le YAML

    let content = (templates as any)[type];
    if (!content) continue;

    const docData = typeof config[type] === 'object' ? config[type] : {};
    
    // 1. Préparation des données
    const variables = mapVariables(type, config, docData);
    
    // 2. Injection dans le template
    const finalContent = injectVariables(content, variables);

    // 3. Génération du nom de fichier
    const clientName = (config.client?.name || "Client").replace(/[^a-z0-9]/gi, "_");
    const outName = docData.output_name || `${DOC_CONFIG[type].prefix}_${clientName}`;
    const finalPath = values.out ? join(values.out, `${outName}.typ`) : `${outName}.typ`;

    // 4. Écriture et Compilation
    const dir = dirname(finalPath);
    if (dir !== "." && !existsSync(dir)) mkdirSync(dir, { recursive: true });

    await Bun.write(finalPath, finalContent);
    compileTypst(finalPath);
  }

  outro("Tous les documents ont été générés. ✨");
}

main().catch(console.error);
