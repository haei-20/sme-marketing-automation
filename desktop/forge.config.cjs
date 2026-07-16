const path = require("node:path");

module.exports = {
  packagerConfig: {
    name: "SMEMarketingAutomation",
    executableName: "SME Marketing Automation",
    asar: true,
    extraResource: [path.resolve(__dirname, "../frontend/dist")],
    ignore: [
      /^\/src($|\/)/,
      /^\/test($|\/)/,
      /^\/out($|\/)/,
      /^\/tsconfig\.json$/,
      /^\/README\.md$/,
    ],
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "SMEMarketingAutomation",
        authors: "SME Marketing Automation Team",
        description: "Trợ lý AI marketing local-first dành cho SME.",
        setupExe: "SME-Marketing-Automation-Setup.exe",
        noMsi: true,
      },
    },
  ],
};
