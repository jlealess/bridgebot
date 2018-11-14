const { WebClient } = require("@slack/client");
const { parse } = require("querystring");
const fetch = require("node-fetch");

// use this to make firebase queries!
const { db } = require("./db");

const token = process.env.SLACK_TOKEN;

const COMMON_HEADERS = {
  "content-type": "application/json",
  "Access-Control-Allow-Origin": "*"
};

const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://iwabvn0ttj.execute-api.us-east-1.amazonaws.com/dev"
    : "http://localhost:3001";

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
    .then(data => loopThroughUsers(data))
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
  global.selectedQuestion = body.payload.pollQuestion;
  global.pollID = body.payload.pollId.toString();

  return db
    .collection("polls")
    .doc(body.payload.pollId.toString())
    .set(body.payload)
    .then(ref => {
      return fetch(`${API_BASE_URL}/user-list`, {
        method: "POST",
        headers: COMMON_HEADERS,
        body: JSON.stringify({
          usergroup: "CDCRXBSHL"
        })
      }).then(data => ({ ...data, body: { success: true, message: ref.id } }));
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

const loopThroughUsers = users => {
  const members = users.members;
  members.forEach(member => messageUser(member));
};

const messageUser = event => {
  const web = new WebClient(token);
  return web.chat
    .postMessage({
      channel: event,
      attachments: [
        {
          text: global.selectedQuestion,
          attachment_type: "default",
          actions: [
            {
              name: "answer",
              text: "Yes",
              type: "button",
              value: "yes"
            },
            {
              name: "answer",
              text: "No",
              type: "button",
              value: "no"
            },
            {
              name: "answer",
              text: "Maybe",
              type: "button",
              value: "maybe"
            }
          ],
          callback_id: global.pollID
        }
      ]
    })
    .then(res => {
      return { statusCode: 200, headers: COMMON_HEADERS, body: JSON.stringify(res) };
    })
    .catch(err => {
      return { statusCode: 500, headers: COMMON_HEADERS, body: JSON.stringify(
          {
            error: err.message
          }
        ) };
    });
};

module.exports.handleUserResponse = (event, context, callback) => {
  const data = decodeURIComponent(event.body);
  const response = JSON.parse(data.substring(8));
  const clickedAnswer = response.actions[0].value;
  const pollId = response.callback_id;
  const answer = {answer: clickedAnswer, pollId};

  return db
    .collection("responses")
    .doc()
    .set(answer)
    .then(res => {
      return { statusCode: 200, headers: COMMON_HEADERS, body: `You answered '${clickedAnswer}'. Thanks for participating in the poll!` };
    })
    .catch(err => {
      return { statusCode: 500, headers: COMMON_HEADERS, body: JSON.stringify(
        {
          error: err.message
        }
      )};
    });
};
