const { isBlank } = require('./util');

const sensitiveEndpoints = ['/users/reset/verify', '/users/(.*?)/password'];

const init = (config) => {
  if ((config == null) || isBlank(config.key) || isBlank(config.project)) {
    // return a noop object that returns the hooks but does nothing.
    return {
      Handlers: {
        requestHandler() { return (request, response, next) => next(); },
        errorHandler() { return (error, request, response, next) => next(error); }
      }
    };
  }

  // otherwise initialize Sentry with some settings we want.
  const Sentry = require('@sentry/node');
  Sentry.init({
    dsn: `https://${config.key}@sentry.io/${config.project}`,
    beforeSend(event) {
      if (event.request && event.request.url) {
        for (const endpoint of sensitiveEndpoints) {
          if (event.request.url.match(endpoint)) {
            event.request.data = null;
          }
        }
      }

      // only file the event if it is a bare exception or it is a true 500.x Problem.
      const error = event.extra.Error;
      if (error == null) return event; // we aren't sure why there isn't an exception; pass through.
      if ((error.isProblem !== true) || (error.httpCode === 500)) return event; // throw exceptions.
      return null; // we have a user-space problem.
    }
  });
  return Sentry;
};

module.exports = { init };

