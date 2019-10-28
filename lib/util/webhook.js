// Recieves a form and, converts it to json and pushes it to our webhook.

// Libraries
const request = require("request");
const parseString = require("xml2js").parseString;

// Constants
const WEBHOOK_URL =
  "https://getin-server.herokuapp.com/api/v1/mapping_encounter_webhook";

const BACKEND_URL = "http://localhost:8383";

// Recieves and Instance ID, a form ID and a project ID then retrieves the xml attached, converts it to a json object and pushes it to our backend service
const pushToWebhook = (instanceId, formId, projectId) => {
  const submisionURL = `${BACKEND_URL}/v1/projects/${projectId}/forms/${formId}/submissions/${instanceId}.xml`;

  // Get access token to use
  const getAccessToken = request(
    {
      method: "POST",
      url: `${BACKEND_URL}/v1/sessions`,
      headers: {
        "Content-Type": "application/json"
      },
      // Find a better way of parsing these credentials.
      body: '{  "email": "pkigenyi@outbox.co.ug",  "password": "Doppler25"}'
    },
    function(error, response, body) {
      // Token is returned as a string, eg "{"token":"Tj4UrWiGX04vjO!RmNs7cdp8CROtsfaTiQmcRSaH7bWiyLTo9MwTlu4M9fcX0F4q",
      // "csrf":"OT9jtjckI$RcHmfD33AF6aTDTnrWTI0d9sgV5jBh7wH7D2HqnWdR3hrVNOtmeV5t","expiresAt":"2019-10-29T11:57:11.716Z","createdAt":"2019-10-28T11:57:11.716Z"}"
      let token = JSON.parse(response.body);
      return "Bearer " + token.token;
    }
  );

  const GetXMLOptions = {
    url: submisionURL,
    headers: {
      Authorization: getAccessToken
    }
  };

  // Get the xml data
  request(GetXMLOptions, function(error, response, body) {
    if (error) throw new Error(error);

    // This is abit hacky but time constrainst. Penned for refactor later
    // First we parse the xml into a json, then chain a new request to post
    // that json object to our python endpoint

    parseString(body, function(err, json) {
      const endpointOptions = {
        method: "POST",
        url: WEBHOOK_URL,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(json),
        json: true
      };
      // Push to webhook
      request(endpointOptions, function(error, response, data) {
        // break if debugger
        debugger;
        if (error) throw new Error(error);
        console.log(response.body);
      });
    });
  });

  return;
};

module.exports = {
  pushToWebhook
};
