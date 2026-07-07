'use strict';

/** @type {import('@cucumber/cucumber').IConfiguration} */
module.exports = {
  default: {
    // Archivos .feature a ejecutar
    paths: ['features/**/*.feature'],

    // Step definitions (CommonJS, compatible con el resto del backend)
    require: ['features/step_definitions/**/*.js'],

    // Idioma de los archivos .feature
    language: 'es',

    // Formatos de salida
    format: [
      'progress-bar',                          // consola: barra de progreso
      'html:reports/cucumber-report.html',     // reporte visual navegable
      'json:reports/cucumber-report.json',     // para CI/integración futura
    ],

    formatOptions: {
      snippetInterface: 'async-await', // estilo de los snippets sugeridos
    },
  },
};
