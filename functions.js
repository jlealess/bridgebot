const { WebClient } = require("@slack/client");
const { parse } = require("querystring");

// use this to make firebase queries!
const { db } = require("./db");

const token = process.env.SLACK_TOKEN;

const COMMON_HEADERS = {
  "content-type": "application/json",
  "Access-Control-Allow-Origin": "*"
};

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
        headers: COMMON_HEADERS,
        body: JSON.stringify(res)
      };
    })
    .catch(err => {
      return {
        statusCode: 500,
        headers: COMMON_HEADERS,
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
        headers: COMMON_HEADERS,
        body: JSON.stringify(res)
      };
    })
    .catch(err => {
      return {
        statusCode: 500,
        headers: COMMON_HEADERS,
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
      return {
        statusCode: 200,
        headers: COMMON_HEADERS,
        body: JSON.stringify(res)
      };
    })
    .catch(err => {
      return {
        statusCode: 500,
        headers: COMMON_HEADERS,
        body: JSON.stringify({
          error: err.message
        })
      };
    });
};

module.exports.submitPollQuestion = (event, context, callback) => {
  const body = JSON.parse(event.body);

  return db
    .collection("polls")
    .add(body.payload)
    .then(ref => ({
      statusCode: 200,
      headers: COMMON_HEADERS,
      body: JSON.stringify({
        success: true,
        message: ref.id
      })
    }));
};

module.exports.getSinglePollQuestion = (event, context, callback) => {
  const body = JSON.parse(event.body);

  return db
    .collection("polls")
    .doc(body.id)
    .get()
    .then(doc => ({
      statusCode: 200,
      headers: COMMON_HEADERS,
      body: JSON.stringify({
        success: true,
        message: doc.data()
      })
    }))
    .catch(err => ({
      statusCode: 500,
      headers: COMMON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: err.message
      })
    }));
};

module.exports.getAllPollQuestions = () => {
  return db
    .collection("polls")
    .get()
    .then(qSnapshot => ({
      statusCode: 200,
      headers: COMMON_HEADERS,
      body: JSON.stringify({
        success: true,
        message: qSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }))
      })
    }))
    .catch(err => ({
      statusCode: 500,
      headers: COMMON_HEADERS,
      body: JSON.stringify({
        success: false,
        message: err.message
      })
    }));
};
