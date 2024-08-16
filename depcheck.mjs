import path from "path";
import depcheck from "depcheck";
import pkg from "./package.json" assert { type: "json" };
import fs from "fs";

const items = {
  missing: "Missing dep", // a lookup containing the dependencies missing in `package.json` and where they are used
  dependencies: "Unused dep", // an array containing the unused dependencies
  devDependencies: "Unused devDep", // an array containing the unused devDependencies
};

const globalIgnores = [
  // "@babel/eslint-parser",
  // "@markhor/eslint-config",
  // "@prisma/client",
  // "@shared/typescript",
  // "@types/node",
  // "@types/react-dom",
  // "@typescript-eslint/*",
  // "apps",
  // "autoprefixer",
  // "depcheck",
  // "esbuild",
  // "eslint-config-*",
  // "eslint-plugin-*",
  // "eslint",
  // "node-fetch",
  // "prettier",
  // "prisma-dbml-generator",
  // "prosemirror-view",
  // "y-prosemirror",
];

const workspaceIgnores = {
  // "apps/app": [],
  // "apps/horst": ["prettier-plugin-tailwindcss"],
  // "packages/app/api": [],
  // "packages/canvas/journey-map": [],
  // "packages/canvas/types": [],
};

let results = [];

const run = new Promise((resolve, reject) => {
  pkg.workspaces.map((dir) => {
    const resolvedPath = path.resolve(dir);

    depcheck(resolvedPath, {
      ignoreMatches: workspaceIgnores[dir]
        ? globalIgnores.concat(workspaceIgnores[dir])
        : globalIgnores,
    }).then((unused) => {
      const result = { dir: dir };
      Object.keys(items).map((i) => {
        result[i] = Array.isArray(unused[i])
          ? unused[i]
          : Object.keys(unused[i]);
      });

      results.push(result);

      if (results.length >= pkg.workspaces.length) resolve(results);
    });
  });
});

run.then((results) => {
  let lines = [];
  results.map((result) => {
    Object.keys(items).map((item) => {
      result[item].map((dependency) => {
        const line = `${result.dir} - ${items[item]}: ${dependency}`;
        lines.push(line);
      });
    });
  });

  fs.writeFile("depcheck.txt", lines.sort().join("\n"), (err) => {
    if (err) throw err;
    console.log("Done");
  });
});
