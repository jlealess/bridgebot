const { WebClient } = require("@slack/client");
const { parse } = require("querystring");

// use this to make firebase queries!
const { db } = require("./db");

const token = process.env.SLACK_TOKEN;

module.exports.pollGroup = (event, context, callback) => {
  const web = new WebClient(token);
  const body = JSON.parse(event.body);
  return web.chat
    .postMessage({
      channel: body.channel,
      attachments: [
        {
          text: "Hello from BridgeBot!"
        }
      ]
    })
    .then(res => {
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(res)
      };
    })
    .catch(err => {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          error: err.message
        })
      };
    });
};

module.exports.getChannelsList = (event, context, callback) => {
  const web = new WebClient(token);
  return web.conversations
    .list()
    .then(res => {
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(res)
      };
    })
    .catch(err => {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          error: err.message
        })
      };
    });
};

module.exports.getUserList = (event, context, callback) => {
  const web = new WebClient(token);
  const body = JSON.parse(event.body);
  return web.conversations
    .members({ 
      channel: body.usergroup 
    })
    .then(res => {
      return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(res) };
    })
    .catch(err => {
      return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(
          {
            error: err.message
          }
        ) };
    });
};

module.exports.submitPollQuestion = (event, context, callback) => {
  const body = JSON.parse(event.body);
  return new Promise(resolve => resolve({
    statusCode: 200,
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      success: true,
      message: JSON.stringify(body)
    })
  }))
}