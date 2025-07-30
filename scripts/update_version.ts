import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

// Info: (20250730 - Tzuhan) 讀 package.json
const pkgPath = resolve(__dirname, "../package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

// Info: (20250730 - Tzuhan) 簡單做 patch bump
const [major, minor, patch] = pkg.version.split(".").map(Number);
pkg.version = [major, minor, patch + 1].join(".");

// Info: (20250730 - Tzuhan) 寫回去
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

console.log(`Bumped version to ${pkg.version}`);
