/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const BoopItData = require("./boop_it_data");

const GadgetDirectives = require('util/gadgetDirectives.js');
const BasicAnimations = require('button_animations/basicAnimations.js');

const TODAY = new Date();

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    let speechText = "";

    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (sessionAttributes.gamesCount === 0) {
      speechText = BoopItData.WELCOME_PHRASES[0];
    } else {
      speechText = BoopItData.WELCOME_PHRASES[getRandom.call(this, 1, BoopItData.WELCOME_PHRASES.length - 1)];
    }
    sessionAttributes.registering = false;
    sessionAttributes.gameStarted = false;
    sessionAttributes.isRollCallComplete = false;

    return handlerInput.responseBuilder
      .speak(speechText + BoopItData.WELCOME_REPROMPT)
      .reprompt(BoopItData.WELCOME_REPROMPT)
      .withSimpleCard('Boop It Buttons', speechText)
      .getResponse();
  },
};

const RegisterIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'RegisterIntent';
  },
  handle(handlerInput) {
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    sessionAttributes.isRollCallComplete = false;
    sessionAttributes.gameStarted = false;
    sessionAttributes.registering = true;
    sessionAttributes.buttonCount = 0;

    sessionAttributes.DeviceId = Array.apply(null, {
      length: 4
    });
    sessionAttributes.DeviceId[0] = "Device ID Listings";

    let response = handlerInput.responseBuilder.getResponse();
    response.directives = [];
    response.directives.push(GadgetDirectives.startInputHandler({ 
            'timeout': BoopItData.ROLL_CALL_TIMEOUT,
            'recognizers': BoopItData.RECOGNIZERS, 
            'events': BoopItData.EVENTS 
    }));
    response.directives.push(GadgetDirectives.setButtonDownAnimation({
        'targetGadgets': [],
        'animations': BasicAnimations.SolidAnimation(1, "green", 8000)
    }));

    return handlerInput.responseBuilder
      .speak("Push each of your three buttons one at a time. ")
      .withSimpleCard('Boop it Buttons', "Push each of your three buttons one at a time. ")
      .getResponse();
  },
};

const StartGameIntentHandler = {
  canHandle(handlerInput) {
    console.log("m3l00t halp: " + JSON.stringify(handlerInput));
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'StartGameIntent';
  },
  handle(handlerInput) {
    console.log("HackBrew is here");

    let speechText = "";

    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.gamesCount += 1;
    //calculateConsecutiveDays.call(this, sessionAttributes);
    sessionAttributes.gameStarted = true;

    //handlerInput.requestEnvelope.request.events = [];

    sessionAttributes.currHitCount = -1;
    return correctHit.call(this, handlerInput, sessionAttributes);
  },
};

const LeaderboardIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'LeaderboardIntent';
  },
  handle(handlerInput) {
    let speechText = 'Hello World!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const BadgeIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'BadgeIntent';
  },
  handle(handlerInput) {
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let totalBadges = sessionAttributes.badges.count;
    let gamesBadge = sessionAttributes.badges.gamesBadge;
    let daysBadge = sessionAttributes.badges.daysBadge;
    let maxHitBadge = sessionAttributes.badges.maxHitBadge;
    let leaderboardBadge = sessionAttributes.badges.leaderboardBadge;
    let loserBadge = sessionAttributes.badges.loserBadge;

    let speechText = "You have earned " + totalBadges + " total badges! "
        + BoopItData.GAME_COUNT_BADGES[gamesBadge].text
        + BoopItData.CONSECUTIVE_DAYS_BADGES[daysBadge].text
        + BoopItData.MAX_HIT_COUNT_BADGES[maxHitBadge].text
        + BoopItData.LEADERBOARD_BADGES[leaderboardBadge].text;

    if (loserBadge !== 0) {
      speechText += BoopItData.LOSER_BADGES[loserBadge].text;
    }

    speechText += getSpeechCon.call(this, true) + " ";

    return handlerInput.responseBuilder
      .speak(speechText + BoopItData.WELCOME_REPROMPT)
      .reprompt(BoopItData.WELCOME_REPROMPT)
      .withSimpleCard('Boop It Badges', speechText)
      .getResponse();
  },
};

const ResetIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'ResetIntentHandler';
  },
  handle(handlerInput) {
    let speechText = 'Hello World!';
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    resetDB.call(this, sessionAttributes);
    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const OptInIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'OptInIntentHandler';
  },
  handle(handlerInput) {
    let speechText = 'Hello World!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const RollCallGameEngineInputHandler = {
  canHandle(handlerInput) {
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return handlerInput.requestEnvelope.request.type === 'GameEngine.InputHandlerEvent'
        && sessionAttributes.isRollCallComplete === false;
  },
  handle(handlerInput) {
    let gameEngineEvents = handlerInput.requestEnvelope.request.events || [];
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let speechText = "";
    let reprompt = "";
    let response = handlerInput.responseBuilder.getResponse();
    console.log("iScreemCodes helped us and we aren't totally sad. " + JSON.stringify(gameEngineEvents));

    for (let i = 0; i < gameEngineEvents.length; i++) {
      switch(gameEngineEvents[i].name) {
        case 'button_down_event' :
          console.log("A BUTTON HAS BEEN PUSHED FOR ROLL CALL");

          let buttonId = gameEngineEvents[i].inputEvents[0].gadgetId;

          let deviceIds = sessionAttributes.DeviceId;

          // Don't end session, and don't open the microphone
          delete response.shouldEndSession;

          if (deviceIds.indexOf(buttonId) === -1) {
            sessionAttributes.buttonCount += 1;
            sessionAttributes.DeviceId[sessionAttributes.buttonCount] = buttonId;
            // TODO set colors
          } else {
            speechText += "You have already pushed that button! Try dat otha button. ";
          }

          if (sessionAttributes.buttonCount === 1) {
            speechText = "Boop it! ";
            reprompt = "Hit dat button! ";

          } else if (sessionAttributes.buttonCount === 2) {
            //specify which action this is
            //set the light animation
            speechText = "Twist it! ";
            reprompt = "Hit another button! ";

          } else if (sessionAttributes.buttonCount === 3) {
            deviceIds = deviceIds.slice(-2);

            sessionAttributes.registering = false;

            speechText = "Pull it! ";
            reprompt = "Finishing registration. Please wait. ";
            handlerInput.requestEnvelope.request.events = [];
          } else {
            console.log("What the heck is happening: " + sessionAttributes.buttonCount);
          }

          break;
        case 'timeout':
          speechText = "Buttons registered. Now we can play. Ready?";
          reprompt = "To start the game, say engage hyper drive! ";
          sessionAttributes.isRollCallComplete = true;
          //          console.log("TIMEOUT. Bern " + JSON.stringify(handlerInput));

          handlerInput.responseBuilder
            .speak(speechText + reprompt)
            .reprompt(reprompt)
            .withSimpleCard('Boop It Buttons: Registering your Buttons', speechText);

          console.log("Gpcrawford " + JSON.stringify(handlerInput.responseBuilder.getResponse()));

          return handlerInput.responseBuilder.getResponse();
      }
    }

    return handlerInput.responseBuilder
      .speak(speechText + reprompt)
      .withSimpleCard('Boop It Buttons: Registering your Buttons', speechText)
      .getResponse();
  }
};

const StartGameEngineInputHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'GameEngine.InputHandlerEvent';
  },
  handle(handlerInput) {
    let gameEngineEvents = handlerInput.requestEnvelope.request.events || [];
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let speechText = "";
    let reprompt = "";
    let response = handlerInput.responseBuilder.getResponse();
    console.log("iScreemCodes Started the game " + JSON.stringify(gameEngineEvents));

    for (let i = 0; i < gameEngineEvents.length; i++) {
      switch(gameEngineEvents[i].name) {
        case 'button_down_event' :
          console.log("A BUTTON HAS BEEN PUSHED FOR THE GAME");

          let buttonId = gameEngineEvents[i].inputEvents[0].gadgetId;

          let deviceIds = sessionAttributes.DeviceId;

          // Don't end session, and don't open the microphone
          delete response.shouldEndSession;

          if ((deviceIds.indexOf(buttonId) === 1
                && sessionAttributes.currAction === BoopItData.ACTIONS.boop)
              || (deviceIds.indexOf(buttonId) === 2
                && sessionAttributes.currAction === BoopItData.ACTIONS.twist) 
              ||(deviceIds.indexOf(buttonId) === 3
                && sessionAttributes.currAction === BoopItData.ACTIONS.pull)) {
            return correctHit.call(this, handlerInput, sessionAttributes);
            handlerInput.requestEnvelope.request.events = [];
          }

          return incorrectHit.call(this, handlerInput, sessionAttributes);

        case 'timeout':
          return incorrectHit.call(this, handlerInput, sessionAttributes);
      }
    }
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    let speechText = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    let speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log("Chuck_l33 can save us " + JSON.stringify(handlerInput));
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("FALLBACK_MESSAGE")
      .reprompt("FALLBACK_REPROMPT")
      .getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log("DigitalBytes can save us " + JSON.stringify(handlerInput));
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};


//
// INTERCEPTORS
//

const RequestPersistenceInterceptor = {
  async process(handlerInput) {
    if (handlerInput.requestEnvelope.request.type === 'LaunchRequest') {
      // First session opened, grab the data from the db and store in local session
      console.log("GOODBYE");
      let persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
      console.log("HELLO");

      handlerInput.attributesManager.setSessionAttributes(persistentAttributes);
    }

    // Get current attributes from session
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    if (Object.keys(sessionAttributes).length === 0) {
      console.log('NEW USER HEYOOOOO!');
      resetDB.call(this, sessionAttributes);
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    }
  }
};

const ResponsePersistenceInterceptor = {
  async process(handlerInput) {
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    handlerInput.attributesManager.setPersistentAttributes(sessionAttributes);
    await handlerInput.attributesManager.savePersistentAttributes();
    let response = handlerInput.responseBuilder.getResponse();

    // if (sessionAttributes.registering || sessionAttributes.gameStarted) {
    //   // Don't end session, and don't open the microphone
    //   delete response.shouldEndSession;
    // }
  }
};

//
// HELPER FUNCTIONS
//

function resetDB(attributes) {
  attributes.initials = "ZZZ";
  attributes.zipCode = "00000";
  attributes.optIn = false;

  attributes.gamesCount = 0;
  attributes.maxHitCount = 0;
  attributes.consecutiveDays = 0;

  attributes.lastSessionDay = {};
  attributes.lastSessionDay.year = TODAY.getYear();
  attributes.lastSessionDay.month = TODAY.getMonth();
  attributes.lastSessionDay.day = TODAY.getDay();

  attributes.badges = {};
  attributes.badges.gamesBadge = 0;
  attributes.badges.daysBadge = 0;
  attributes.badges.maxHitBadge = 0;
  attributes.badges.leaderboardBadge = 0;
  attributes.badges.loserBadge = 0;
  attributes.badges.count = 0;
}


function getSpeechCon(type) {
    var speechCon = "";
    if (type) {
        return "<say-as interpret-as='interjection'>"
                + BoopItData.POS_SPEECHCONS[getRandom.call(this, 0, BoopItData.POS_SPEECHCONS.length-1)]
                + " </say-as><break strength='strong'/>";
    }
    else {
        return "<say-as interpret-as='interjection'>"
                + BoopItData.NEG_SPEECHCONS[getRandom.call(this, 0, BoopItData.NEG_SPEECHCONS.length-1)]
                + " </say-as><break strength='strong'/>";
    }
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max-min+1)+min);
}

function calculateBadges(attributes) {
  let speechText = "";
  let totalBadges = attributes.badges.count;
  let nextGamesBadge = BoopItData.GAME_COUNT_BADGES[parseInt(attributes.badges.gamesBadge) + 1];
  let nextDaysBadge = BoopItData.CONSECUTIVE_DAYS_BADGES[parseInt(attributes.badges.daysBadge) + 1];
  let nextMaxHitBadge = BoopItData.MAX_HIT_COUNT_BADGES[parseInt(attributes.badges.maxHitBadge) + 1];
  let nextLeaderboardBadge = BoopItData.LEADERBOARD_BADGES[parseInt(attributes.badges.leaderboardBadge) + 1];
  let nextLoserBadge = BoopItData.LOSER_BADGES[attributes.badges.loserBadge];

  if (attributes.gamesCount >= nextGamesBadge.num_games) {
    speechText += "You earned a new games count badge. " + nextGamesBadge.text;
    attributes.badges.gamesBadge = nextGamesBadge.id;
    totalBadges += 1;
  }

  if (attributes.consecutiveDays >= nextDaysBadge.num_days) {
    speechText += "You earned a new consecutive days badge. " + nextDaysBadge.text;
    attributes.badges.daysBadge = nextDaysBadge.id;
    totalBadges += 1;
  }

  if (attributes.maxHitCount >= nextMaxHitBadge.num_hits) {
    speechText += "You earned a new hit streak badge. " + nextMaxHitBadge.text;
    attributes.badges.maxHitBadge = nextMaxHitBadge.id;
    totalBadges += 1;
  }

  // TODO CALC LEADERBOARD AND LOSER BADGES
  return speechText;
}

function calculateConsecutiveDays(attributes) {
  let lastSessionDay = attributes.lastSessionDay;
  let lastDate = new Date(lastSessionDay.year, lastSessionDay.month, lastSessionDay.day);

  let yesterday = new Date();
  yesterday.setDate(TODAY.getDate() - 1);
  yesterday.setHours(0,0,0,0);

  let isNextDay = lastDate.getDate() === yesterday.getDate();
  if (isNextDay) {
    attributes.consecutiveDays += 1;
  } else if (lastDate.getDate() === TODAY.getDate()) {
    console.log("Wuddup oxygenbox!");
  } else {
    attributes.consecutiveDays = 0;
  }

  attributes.lastSessionDay.year = TODAY.getYear();
  attributes.lastSessionDay.month = TODAY.getMonth();
  attributes.lastSessionDay.day = TODAY.getDay();
}

function correctHit(handlerInput, attributes) {
    let speechText = "";

    attributes.currHitCount += 1;

    let response = handlerInput.responseBuilder.getResponse();
    response.directives = [];
    response.directives.push(GadgetDirectives.startInputHandler({ 
            'timeout': BoopItData.GAME_TIMEOUT,
            'recognizers': BoopItData.RECOGNIZERS, 
            'events': BoopItData.EVENTS 
    }));

    let deviceIds = attributes.DeviceId;
    // response.directives.push(GadgetDirectives.setButtonDownAnimation({
    //     'targetGadgets': deviceIds[1],
    //     'animations': BasicAnimations.SolidAnimation(1, BoopItData.ACTIONS.boop.hex, BoopItData.GAME_TIMEOUT)
    // }));
    // response.directives.push(GadgetDirectives.setButtonDownAnimation({
    //     'targetGadgets': deviceIds[2],
    //     'animations': BasicAnimations.SolidAnimation(1, BoopItData.ACTIONS.twist.hex, BoopItData.GAME_TIMEOUT)
    // }));
    // response.directives.push(GadgetDirectives.setButtonDownAnimation({
    //     'targetGadgets': deviceIds[3],
    //     'animations': BasicAnimations.SolidAnimation(1, BoopItData.ACTIONS.pull.hex, BoopItData.GAME_TIMEOUT)
    // }));

    let currActionIndex = getRandom.call(this, 0, 2);
    if (currActionIndex == 0) {
      speechText += "Boop it ";
      attributes.currAction = BoopItData.ACTIONS.boop;
    } else if (currActionIndex == 1) {
      speechText += "Twist it ";
      attributes.currAction = BoopItData.ACTIONS.twist;
    } else {
      speechText = "Pull it ";
      attributes.currAction = BoopItData.ACTIONS.pull;
    }
    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Boop it Buttons', "Boop It, Twist It, Pull It! ")
      .getResponse();
}

function incorrectHit(handlerInput, attributes) {
    let speechText = getSpeechCon.call(false) + " You hit the wrong button. ";
    let reprompt = "If you want to play again, say start game!";

    attributes.gameStarted = false;

    if (attributes.currHitCount > attributes.maxHitCount) {
      attributes.maxHitCount = attributes.currHitCount;
    }
    let response = handlerInput.responseBuilder.getResponse();
    response.directives = [];

    let deviceIds = attributes.DeviceId;
    response.directives.push(GadgetDirectives.setButtonDownAnimation({
        'targetGadgets': deviceIds,
        'animations': BasicAnimations.SolidAnimation(1, "green", BoopItData.GAME_TIMEOUT)
    }));

    return handlerInput.responseBuilder
      .speak(speechText + reprompt)
      .reprompt(reprompt)
      .withSimpleCard('Boop it Buttons', "Boop It, Twist It, Pull It! ")
      .getResponse();
}





const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    RegisterIntentHandler,
    StartGameIntentHandler,
    LeaderboardIntentHandler,
    BadgeIntentHandler,
    ResetIntentHandler,
    OptInIntentHandler,
    RollCallGameEngineInputHandler,
    StartGameEngineInputHandler,
    HelpIntentHandler,
    FallbackHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  //.addRequestInterceptors(RequestPersistenceInterceptor)
  //.addResponseInterceptors(ResponsePersistenceInterceptor)
  .withAutoCreateTable(true)
  .withTableName('BoopItButtonsTable')
  .addErrorHandlers(ErrorHandler)
  .lambda();









