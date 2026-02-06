import { existsSync, unlinkSync } from "node:fs";
import { spawnSync } from "bun";
import { basename } from "node:path";
import { spinner } from "@clack/prompts";

export async function loadYaml(file: string) {
  if (!existsSync(file)) return null;
  try {
    const content = await Bun.file(file).text();
    return Bun.YAML.parse(content);
  } catch (e) { return null; }
}

export function compileTypst(file: string) {
  const s = spinner();
  s.start(`Compilation ${basename(file)}...`);
  const result = spawnSync({ cmd: ["typst", "compile", file] });
  
  if (result.success) {
    s.stop(`✅ PDF prêt : ${file.replace(".typ", ".pdf")}`);
    try { unlinkSync(file); } catch {}
  } else {
    s.stop(`❌ Erreur Typst`);
    if (result.stderr) console.error(result.stderr.toString());
  }
}
