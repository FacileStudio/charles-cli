import { spawnSync } from "bun";
import { parseArgs } from "node:util"; // Import corrigé ici
import {
  intro,
  outro,
  text,
  select,
  multiselect,
  spinner,
  isCancel,
  cancel,
  note,
} from "@clack/prompts";
import { existsSync, mkdirSync } from "node:fs";
import { join, basename, dirname, extname } from "node:path";

// --- CONFIGURATION DES ARGUMENTS ---
const { values } = parseArgs({
  args: Bun.argv.slice(2), // On slice pour ignorer 'bun' et le nom du script
  options: {
    help: { type: "boolean", short: "h" },
    client: { type: "string", short: "c" },
    provider: { type: "string", short: "p" },
    out: { type: "string", short: "o" },
    logo: { type: "string", short: "l" },
  },
  strict: true,
});

// --- AIDE / HELP ---
if (values.help) {
  console.log(`
  🌵 CHARLES - Générateur de documents

  Usage:
    bun run index.ts [options]

  Options:
    -h, --help      Afficher l'aide
    -c, --client    Fichier client.yml (défaut: ./client.yml)
    -p, --provider  Fichier prestataire.yml (défaut: ./prestataire.yml)
    -o, --out       Chemin ou nom du fichier de sortie (.typ)
    -l, --logo      Chemin vers le logo (PNG/JPG)
  `);
  process.exit(0);
}

// --- UTILS ---
async function loadYamlConfig(filename: string): Promise<any | null> {
  if (filename && existsSync(filename)) {
    try {
      const fileContent = await Bun.file(filename).text();
      // @ts-ignore
      return Bun.YAML.parse(fileContent);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function validateCancel(value: any) {
  if (isCancel(value)) {
    cancel("Charles vous salue. À bientôt !");
    process.exit(0);
  }
  return value;
}

// --- LOGIQUE DE SAISIE ---
async function askProducts() {
  const items: any[] = [];
  let addMore = true;
  note("📦 SAISIE DES PRODUITS\nLaissez la description vide pour terminer.");

  while (addMore) {
    const i = items.length + 1;
    const desc = validateCancel(
      await text({ message: `Item #${i} : Description` }),
    );
    if (!desc) break;

    const qty = validateCancel(
      await text({
        message: `Item #${i} : Quantité`,
        placeholder: "1",
        validate: (v) => (isNaN(Number(v)) ? "Nombre requis" : undefined),
      }),
    );
    const unit = validateCancel(
      await text({ message: `Item #${i} : Unité`, placeholder: "jours" }),
    );
    const price = validateCancel(
      await text({
        message: `Item #${i} : Prix HT`,
        placeholder: "500",
        validate: (v) => (isNaN(Number(v)) ? "Montant requis" : undefined),
      }),
    );

    items.push({
      description: desc,
      quantity: Number(qty),
      unit,
      price: Number(price),
    });
    addMore = (await select({
      message: "Ajouter une ligne ?",
      options: [
        { value: true, label: "Oui" },
        { value: false, label: "Terminer" },
      ],
    })) as boolean;
  }
  return items;
}

function compileTypst(file: string) {
  const s = spinner();
  s.start(`Charles compile ${basename(file)}...`);
  const result = spawnSync({ cmd: ["typst", "compile", file] });
  if (!result.success) {
    s.stop(`❌ Erreur Typst sur ${file}`);
    if (result.stderr) console.error(result.stderr.toString());
  } else {
    s.stop(`✅ PDF prêt : ${file.replace(".typ", ".pdf")}`);
  }
}

// --- MAIN ---
async function main() {
  intro("🚀 CHARLES - Assistant de Facturation");

  const selectedDocs = validateCancel(
    await multiselect({
      message: "Que devons-nous générer ?",
      options: [
        { value: "1", label: "Devis Prestation" },
        { value: "2", label: "Devis Maintenance" },
        { value: "3", label: "Contrat Maintenance" },
      ],
      required: true,
    }),
  ) as string[];

  const provider = await loadYamlConfig(values.provider || "./prestataire.yml");
  const client = await loadYamlConfig(values.client || "./client.yml");

  if (provider) note("✅ Configuration prestataire chargée.");
  if (client) note("✅ Configuration client chargée.");

  note("📄 DÉTAILS DU DOCUMENT");
  const common = {
    number: validateCancel(
      await text({ message: "N° Document", placeholder: "2026-xxx" }),
    ),
    date: validateCancel(
      await text({ message: "Date", placeholder: "01/02/2026" }),
    ),
    due: validateCancel(
      await text({ message: "Échéance", placeholder: "01/03/2026" }),
    ),
    ref: validateCancel(
      await text({ message: "Référence Contrat", placeholder: "C-2026-X" }),
    ),
  };

  let products: any[] = [];
  if (selectedDocs.some((d) => ["1", "2"].includes(d))) {
    products = await askProducts();
  }

  for (const doc of selectedDocs) {
    const config = {
      "1": { tmpl: "devis-prestation.typ", out: "Devis_Presta" },
      "2": { tmpl: "devis-maintenance.typ", out: "Devis_Maint" },
      "3": { tmpl: "contrat-maintenance.typ", out: "Contrat_Maint" },
    }[doc as "1" | "2" | "3"]!;

    const templatePath = `./templates/${config.tmpl}`;
    if (!existsSync(templatePath)) {
      note(`Template ${config.tmpl} manquant dans /templates`, "Erreur");
      continue;
    }

    let content = await Bun.file(templatePath).text();

    const itemsFormatted =
      products.length > 0
        ? products
            .map(
              (p) =>
                `(description: "${p.description}", quantity: ${p.quantity}, unit: "${p.unit}", price: ${p.price})`,
            )
            .join(", ") + ","
        : "";

    const replacements: Record<string, string> = {
      "{{invoice_number}}": common.number,
      "{{quote_number}}": common.number,
      "{{invoice_date}}": common.date,
      "{{quote_date}}": common.date,
      "{{contract_date}}": common.date,
      "{{due_date}}": common.due,
      "{{validity_date}}": common.due,
      "{{client_name}}": client?.name || "Client",
      "{{client_address}}": client?.address || "",
      "{{client_city}}": client?.city || "",
      "{{client_country}}": client?.country || "France",
      "{{client_siret}}": client?.siret || "",
      "{{provider_name}}": provider?.name || "Dev",
      "{{provider_legal}}": provider?.legal_name || provider?.name || "",
      "{{provider_address}}": provider?.address || "",
      "{{provider_city}}": provider?.city || "",
      "{{provider_siret}}": provider?.siret || "",
      "{{provider_email}}": provider?.email || "",
      "{{provider_phone}}": provider?.phone || "",
      "{{bank_name}}": provider?.bank_name || "",
      "{{iban}}": provider?.iban || "",
      "{{bic}}": provider?.bic || "",
      "{{tva_rate}}": String(provider?.tva_rate || 20),
      "{{contract_reference}}": common.ref,
      "{{items}}": itemsFormatted,
      "{{logo_path}}": values.logo || "",
    };

    for (const [key, val] of Object.entries(replacements)) {
      content = content.replaceAll(key, val);
    }

    let finalPath = "";
    if (values.out) {
      if (extname(values.out) === ".typ") {
        finalPath = values.out;
      } else {
        const safeClientName = (client?.name || "SansNom").replace(
          /[^a-z0-9]/gi,
          "_",
        );
        finalPath = join(values.out, `${config.out}_${safeClientName}.typ`);
      }
    } else {
      const safeClientName = (client?.name || "SansNom").replace(
        /[^a-z0-9]/gi,
        "_",
      );
      finalPath = `${config.out}_${safeClientName}.typ`;
    }

    const parentDir = dirname(finalPath);
    if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });

    await Bun.write(finalPath, content);
    compileTypst(finalPath);
  }

  outro("Mission accomplie. Charles se retire. ✨");
}

main().catch(console.error);
