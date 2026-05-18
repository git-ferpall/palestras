/**
 * Copia logos de src/logos para public/logos (servidas estaticamente pelo Next).
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const srcDir = path.join(root, "src", "logos");
const destDir = path.join(root, "public", "logos");

const copies = [
  ["logo-abrarastro-vertical.png", "abrarastro.png"],
  ["abrarastro.png", "abrarastro.png"],
  ["frutag.png", "frutag.png"],
];

fs.mkdirSync(destDir, { recursive: true });

let copied = 0;
for (const [from, to] of copies) {
  const src = path.join(srcDir, from);
  const dest = path.join(destDir, to);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`OK: ${from} -> public/logos/${to}`);
    copied++;
  }
}

const assSrc = path.join(root, "src", "assinaturas");
const assDest = path.join(root, "public", "assinaturas");
fs.mkdirSync(assDest, { recursive: true });
if (fs.existsSync(assSrc)) {
  for (const file of fs.readdirSync(assSrc)) {
    if (/^presidencia\.(png|jpe?g)$/i.test(file)) {
      fs.copyFileSync(path.join(assSrc, file), path.join(assDest, file));
      console.log(`OK: assinaturas/${file} -> public/assinaturas/${file}`);
    }
  }
}

if (!fs.existsSync(path.join(destDir, "abrarastro.png"))) {
  console.warn(
    "AVISO: public/logos/abrarastro.png nao criado. Coloque logo-abrarastro-vertical.png em src/logos/"
  );
  process.exit(copied > 0 ? 0 : 1);
}
