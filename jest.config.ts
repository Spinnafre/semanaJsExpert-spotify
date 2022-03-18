const defaultConfig = {
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: [
    "text",
    "lcov",
  ],
  //Os testes tem que passar em 100%
  coverageThreshold: {
    global: {
      branch: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    }
  },
  maxWorkers: "50%",
  watchPathIgnorePatterns: [
    "node_modules"
  ],
  //transforma ECMASCRIPT em js mais antigo por baixo dos panos caso for necessário
  transformIgnorePatterns: [
    "node_modules"
  ]
}
export default {
  projects: [
    //Configuração para cada projeto
    {
      ...defaultConfig,
      testEnvironment: "node",
      displayName: "backend",
      collectCoverageFrom: [
        "server/",
        "!server/index.js",//Ignorar o arquivo de infra (Onde o servidor é instanciado)
      ],
      transformIgnorePatterns: [
        ...defaultConfig.transformIgnorePatterns,
        "public"
      ],
      testMatch: [
        "**/tests/**/server/**/*.test.js"
      ]
    },
    {
      ...defaultConfig,
      testEnvironment: "jsdom",
      displayName: "frontend",
      collectCoverageFrom: [
        "public/",
      ],
      transformIgnorePatterns: [
        ...defaultConfig.transformIgnorePatterns,
        "server"
      ],
      testMatch: [
        "**/tests/**/public/**/*.test.js"
      ]
    },
  ]
}