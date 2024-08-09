require("dotenv").config({ path: "./.env.test" });

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "backend/tsconfig.json",
      },
    ],
  },
};

