const TOML = require("@iarna/toml");
const fs = require("fs");
const path = require("path");

const nargoTomlTemplate = TOML.parse(
  fs.readFileSync("./Nargo.template.toml", "utf8")
);
const autogeneratedCircuitsPath = path.join(__dirname, "crates/autogenerated");

if (fs.existsSync(autogeneratedCircuitsPath)) {
  fs.rmSync(autogeneratedCircuitsPath, { recursive: true });
}
fs.mkdirSync(autogeneratedCircuitsPath);

function generateResetVariants() {
  const resetVariants = require("./reset_variants.json");

  generateVariants("private-kernel-reset", resetVariants);
  generateVariants("private-kernel-reset-simulated", resetVariants);
}

function generateVariants(originalFolder, variantsArray) {
  const originalCrateFolder = path.join(__dirname, "crates", originalFolder);
  const originalNargoToml = TOML.parse(
    fs.readFileSync(path.join(originalCrateFolder, "Nargo.toml"), "utf8")
  );
  const originalName = originalNargoToml.package.name;

  for ({ tag, replacements } of variantsArray) {
    const variantFolder = `${originalFolder}-${tag}`;
    const variantNargoToml = structuredClone(originalNargoToml);
    for ([depName, depDescriptor] of Object.entries(
      variantNargoToml.dependencies
    )) {
      if (depDescriptor.path) {
        depDescriptor.path = "../" + depDescriptor.path;
      }
    }
    variantNargoToml.package.name = `${originalName}_${tag.replaceAll(
      "-",
      "_"
    )}`;

    let mainDotNoirCode = fs.readFileSync(
      path.join(originalCrateFolder, "src/main.nr"),
      "utf8"
    );

    for ([variableName, variableValue] of Object.entries(replacements)) {
      mainDotNoirCode = mainDotNoirCode.replace(
        new RegExp(`^global\\s+${variableName}\\s=\\s.*;.*$`, "m"),
        `global ${variableName} = ${variableValue};`
      );
    }

    fs.mkdirSync(path.join(autogeneratedCircuitsPath, variantFolder, "src"), {
      recursive: true,
    });

    fs.writeFileSync(
      path.join(autogeneratedCircuitsPath, variantFolder, "src/main.nr"),
      mainDotNoirCode
    );

    fs.writeFileSync(
      path.join(autogeneratedCircuitsPath, variantFolder, "Nargo.toml"),
      TOML.stringify(variantNargoToml)
    );
  }
}

generateResetVariants();

for (entry of fs.readdirSync(autogeneratedCircuitsPath)) {
  nargoTomlTemplate.workspace.members.push(
    path.relative(__dirname, path.join(autogeneratedCircuitsPath, entry))
  );
}

fs.writeFileSync(
  "./Nargo.toml",
  `# THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.\n${TOML.stringify(
    nargoTomlTemplate
  )}`
);
