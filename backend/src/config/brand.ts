// Single source of truth for backend-facing product identity.
// White-labelling = set APP_NAME (env) or edit the defaults here.
const APP_NAME = process.env.APP_NAME || 'Survival Sydney';

const API_TITLE = `${APP_NAME} API`;
const API_DESCRIPTION = `API documentation for the ${APP_NAME} assessment platform.`;

export { APP_NAME, API_TITLE, API_DESCRIPTION };
