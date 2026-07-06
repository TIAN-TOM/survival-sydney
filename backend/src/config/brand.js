// Single source of truth for backend-facing product identity.
// White-labelling = set APP_NAME (env) or edit the defaults here.
const APP_NAME = process.env.APP_NAME || 'OpenAssess';

module.exports = {
  APP_NAME,
  API_TITLE: `${APP_NAME} API`,
  API_DESCRIPTION: `API documentation for the ${APP_NAME} assessment platform.`,
};
