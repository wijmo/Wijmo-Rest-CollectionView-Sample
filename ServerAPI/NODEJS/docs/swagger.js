const options = {
    openapi: "OpenAPI 3",
    language: "en-US",
    disableLogs: false,
    autoHeaders: false,
    autoQuery: false,
    autoBody: false,
  };
  const generateSwagger = require("swagger-autogen")();
  
  const swaggerDocument = {
    info: {
      version: "1.0.0",
      title: "Mescius.Wijmo.Sample RestApi  ",
      description: ""
    },
    host: "localhost:4000",
    basePath: "/",
    schemes: ["http"],
    consumes: ["application/json"],
    produces: ["application/json"],
  };
  const swaggerFile= "./docs/swagger.json";
  const apiRouteFile= ["./index.js"];
  generateSwagger(swaggerFile, apiRouteFile, swaggerDocument);