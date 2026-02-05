import { spawnSync } from "bun";
import { parseArgs } from "node:util";
import { intro, outro, spinner, note } from "@clack/prompts";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { join, basename, dirname } from "node:path";

import { templates } from "./templates";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    help: { type: "boolean", short: "h" },
    file: { type: "string", short: "f" },
    out: { type: "string", short: "o" },
    logo: { type: "string", short: "l" },
  },
  strict: true,
});

if (values.help) {
  console.log(`
  🌵 CHARLES CLI
  Générateur de documents professionnel (Typst + Bun)

  Usage:
    bun run index.ts [-f job.yml] [-o ./output]

  Options:
    -f, --file    Fichier YAML (par défaut: job.yml)
    -o, --out     Dossier de sortie pour les PDF
    -l, --logo    Surcharge du chemin du logo
  `);
  process.exit(0);
}

const DOC_CONFIG = {
  prestation: { label: "Devis Prestation", prefix: "Devis_Presta" },
  maintenance: { label: "Devis Maintenance", prefix: "Devis_Maint" },
  contrat: { label: "Contrat", prefix: "Contrat" },
};

async function loadYaml(file: string) {
  if (!existsSync(file)) return null;
  try {
    const content = await Bun.file(file).text();
    // @ts-ignore
    return Bun.YAML.parse(content);
  } catch (e) {
    return null;
  }
}

function compileTypst(file: string) {
  const s = spinner();
  s.start(`Compilation ${basename(file)}...`);
  
  const result = spawnSync({ cmd: ["typst", "compile", file] });

  if (result.success) {
    s.stop(`✅ PDF prêt : ${file.replace(".typ", ".pdf")}`);
    try { unlinkSync(file); } catch {}
  } else {
    s.stop(`❌ Erreur Typst lors de la compilation`);
    if (result.stderr) console.error(result.stderr.toString());
  }
}

async function main() {
  const configPath = values.file || (existsSync("./job.yml") ? "./job.yml" : null);

  if (!configPath) {
    console.error("❌ Erreur : Fichier job.yml introuvable dans le répertoire courant.");
    process.exit(1);
  }

  const config = await loadYaml(configPath);
  if (!config) {
    console.error(`❌ Impossible de lire ou de parser le fichier ${configPath}`);
    process.exit(1);
  }

  intro(`🚀 CHARLES - Traitement de ${basename(configPath)}`);

  const activeDocs = Object.keys(DOC_CONFIG).filter(key => config[key]);

  for (const type of activeDocs) {
    const meta = DOC_CONFIG[type as keyof typeof DOC_CONFIG];
    let content = (templates as any)[type];
    
    if (!content) {
      note(`Template pour "${type}" manquant dans templates.ts`, "Info");
      continue;
    }

    const prestataire = config.prestataire || {};
    const client = config.client || {};
    const docData = config[type] || {};

    const itemsRaw = docData.items || [];
    const itemsFormatted = itemsRaw.map((p: any) => 
      `(description: "${p.description}", quantity: ${p.quantity}, unit: "${p.unit}", price: ${p.price})`
    ).join(", ") + (itemsRaw.length > 0 ? "," : "");

    const r: Record<string, any> = {
      ...config,
      ...prestataire,
      ...docData,
      items: itemsFormatted,
      logo_path: values.logo || docData.logo || config.logo || "logo.png",
      
      invoice_number: docData.number || config.number || "SANS-NUMERO",
      quote_number: docData.number || config.number || "SANS-NUMERO",
      invoice_date: docData.date || config.date || "",
      quote_date: docData.date || config.date || "",
      contract_date: docData.date || config.date || "",
      due_date: docData.due || docData.validity_date || "",
    };

    Object.entries(prestataire).forEach(([k, v]) => r[`provider_${k}`] = v);
    Object.entries(client).forEach(([k, v]) => r[`client_${k}`] = v);

    const tags = content.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
    
    tags.forEach((tag: string) => {
      const key = tag.slice(2, -2);
      if (r[key] !== undefined) {
        content = content.replaceAll(tag, String(r[key]));
      } else {
        const isNumeric = key.match(/rate|price|amount|estimate|qty/);
        content = content.replaceAll(tag, isNumeric ? "0" : "");
      }
    });

    const clientName = (client.name || "Client").replace(/[^a-z0-9]/gi, "_");
    const outName = docData.output_name || `${meta.prefix}_${clientName}`;
    const finalPath = values.out ? join(values.out, `${outName}.typ`) : `${outName}.typ`;

    const dir = dirname(finalPath);
    if (dir !== "." && !existsSync(dir)) mkdirSync(dir, { recursive: true });

    await Bun.write(finalPath, content);
    compileTypst(finalPath);
  }

  outro("Mission accomplie. Tous les PDF sont générés. ✨");
}

main().catch(console.error);
