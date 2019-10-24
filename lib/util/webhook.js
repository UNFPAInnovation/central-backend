// Recieves a form and, converts it to json and pushes it to our webhook.

// Libraries
const request = require("request");
const parseString = require("xml2js").parseString;

// Constants
const WEBHOOK_URL =
  "http://getin-server.herokuapp.com/api/v1/mapping_encounter_webhook";

// Recieves and Instance ID, a form ID and a project ID then retrieves the xml attached, converts it to a json object and pushes it to our backend service
const pushToWebhook = (instanceId, formId, projectId) => {
  const submisionURL = `http://localhost:8989/v1/projects/${projectId}/forms/${formId}/submissions/${instanceId}.xml`;

  const GetXMLOptions = {
    url: submisionURL,
    // Authorization from username / password | pkigenyi@outbox.co.ug
    headers: {
      Authorization: "Basic cGtpZ2VueWlAb3V0Ym94LmNvLnVnOkRvcHBsZXIyNQ=="
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
