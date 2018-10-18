'use strict';

/*
    Boop It Skill
    An Echo Buttons game to see how many times a player can stay in sync with a action call.
    
    > Alexa, open Boop It Buttons.
    Welcome, register?
    > Register
    > Check leaderboard
    > Get Badges
    > Opt in
    > Reset
    Buttons registered. Play?
    > Play
    Boop it. Pull it. Twist it.

    Leaderboard (global)
      - who has hit the most in in a row overall (top 5)
      - who has hit the most in in a row week (top 5)
      - who has played the most overall (top 5)
      - who has played the most this week (top 5)

    Badges (personal)
      - No badges (id: 0)
      - 10 games (id: 1)
      - 25 games (id : 2)
      - 50 games (id : 3)
      - 100 games (id : 4)
      - 500 games (id : 5)
      - 1000 games (id : 6)
      - 5 consecutive days (id : 8)
      - 10 consecutive days (id : 9)
      - 30 consecutive days (id : 10)
      - 90 consecutive days (id : 11)
      - 365 consecutive days (id : 12)
      - 10 max hit count (id : 13)
      - 50 max hit count (id : 14)
      - 100 max hit count (id : 15)
      - Weekly leaderboard (id : 16)
      - Overall leaderboard (id : 17)
      - Zero hits 10 games in a row (id : 18)
      - Lost consecutive streak of 25 (id : 19)
      - No life badge, played 5000 games (id : 20)

    Intents
      - RegisterIntent = opens roll call for buttons
      - StartGameIntent = buttons registered, start game (effects badges)
      - LeaderboardIntent = reports who is on the leaderboard, recommends opting in if they havent
      - BadgeIntent = reports badges
      - ResetIntent = resets name, consecutive days, badges, etc.
        > Confirmation
        > Slot ellicitation (stretch)
      - OptInIntent = opt in or out of leaderboard
        > Slot ellicitation 

    DynamoDB
      UserId
        * initials : string
        * zipCode : string
        * optIn : boolean
        * gamesCount : number
        * maxHitCount : number
        * consecutiveDays : number
        * lastSessionDay : map
          * year : number
          * month : number
          * day : number
        * badges : map of ids
          * gamesBadge : current id number
          * daysBadge : current id number
          * maxHitBadge : current id number
          * leaderboardBadge : current id number
          * loserBadge : current id number
          * count : number of badges

    Web component
      Map of top players, accessing permissions in the app, opting in via skill
*/

module.exports = {
	WELCOME_PHRASES : [
		"Hi. Welcome to boop it buttons. Where the boop goes on and on. You "
			+ "need three buttons for this skill. When I say a command, press "
			+ "the corresponding button. First we need to register the buttons. ",
	    "This is boop it buttons! Press the button with the correct action. ",
	    "Welcome back to boop it buttons! ",
	    "Hey there! Thanks for playing boop it buttons! ",
	    "This is boop it buttons! "
	],

	WELCOME_REPROMPT : "When you are ready with your 3 buttons, say register. ",

	GAME_COUNT_BADGES : [
		{
			id : 0,
			num_games : 0,
			text : "You have no game count badges! "
		},
		{
			id : 1,
			num_games : 10,
			text : "You have played 10 games! "
		},
		{
			id : 2,
			num_games : 25,
			text : "You have played 25 games! "
		},
		{
			id : 3,
			num_games : 50,
			text : "You have played 50 games! "
		},
		{
			id : 4,
			num_games : 100,
			text : "You have played 100 games! "
		},
		{
			id : 5,
			num_games : 500,
			text : "You have played 500 games! "
		},
		{
			id : 6,
			num_games : 1000,
			text : "You have played 1000 games! "
		}
	],

	CONSECUTIVE_DAYS_BADGES : [
		{
			id : 0,
			num_days : 0,
			text : "You have no consecutive days badges! "
		},
		{
			id : 1,
			num_days : 5,
			text : "You have played Boop It 5 days in a row! "
		},
		{
			id : 2,
			num_days : 10,
			text : "You have played Boop It 10 days in a row! "
		},
		{
			id : 3,
			num_days : 30,
			text : "You have played Boop It 30 days in a row! "
		},
		{
			id : 4,
			num_days : 90,
			text : "You have played Boop It 90 days in a row! "
		},
		{
			id : 5,
			num_days : 365,
			text : "You have played Boop It 365 days in a row! "
		}
	],

	MAX_HIT_COUNT_BADGES : [
		{
			id : 0,
			num_hits : 0,
			text : "You have no max hit badges! "
		},
		{
			id : 1,
			num_hits : 10,
			text : "You have a badge for reaching a max hit count of 10! "
		},
		{
			id : 2,
			num_hits : 50,
			text : "You have a badge for reaching a max hit count of 50! "
		},
		{
			id : 3,
			num_hits : 100,
			text : "You have a badge for reaching a max hit count of 100! "
		}
	],

	LEADERBOARD_BADGES : [
		{
			id : 0,
			text : "You have never been on the leaderboard! "
		},
		{
			id : 1,
			text : "You have a badge for being on the weekly leaderboard! "
		},
		{
			id : 2,
			text : "You have a badge for being on the overall leaderboard! "
		}
	],

	LOSER_BADGES : [
		{
			id : 0,
			text : "You aren't a loser! "
		},
		{
			id : 1,
			text : "You have a badge for getting zero boops for 10 games! Try harder! "
		},
		{
			id : 2,
			text : "You have a badge for losing your greater than 25 consecutive day streak! That sucks!"
		},
		{
			id : 3,
			text : "You have a badge for playing 2500 games! Are you okay? You should go outside!"
		}
	],

	POS_SPEECHCONS : ["Booya", "All righty", "Bam", "Bazinga", "Bingo", "Boom", "Bravo", "Cha Ching", "Cheers", "Dynomite",
			"Hip hip hooray", "Hurrah", "Hurray", "Huzzah", "Oh dear.  Just kidding.  Hurray", "Kaboom", "Kaching", "Oh snap",
			"Phew", "Righto", "Way to go", "Well done", "Whee", "Woo hoo", "Yay", "Wowza", "Yowsa"],

	NEG_SPEECHCONS : ["Argh", "Aw man", "Blarg", "Blast", "Boo", "Bummer", "Darn", "D'oh", "Dun dun dun", "Eek", "Honk",
			"Le sigh", "Mamma mia", "Oh boy", "Oh dear", "Oof", "Ouch", "Ruh roh", "Shucks", "Uh oh", "Wah wah",
			"Whoops a daisy", "Yikes"],

	PROGRESSIVE_AUDIO : [
		'https://s3.amazonaws.com/asksounds/progressive1/p1.mp3', //1s
	    'https://s3.amazonaws.com/asksounds/progressive1/p2.mp3', //1s
	    'https://s3.amazonaws.com/asksounds/progressive1/p3.mp3', //1s
	    'https://s3.amazonaws.com/asksounds/progressive1/p4.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p5.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p6.mp3', //1s
	    'https://s3.amazonaws.com/asksounds/progressive1/p7.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p8.mp3', //1s
	    'https://s3.amazonaws.com/asksounds/progressive1/p9.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p10.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p11.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p12.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p13.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p14.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p15.mp3', //1s
	    'https://s3.amazonaws.com/asksounds/progressive1/p16.mp3', //1s
	    'https://s3.amazonaws.com/asksounds/progressive1/p17.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p18.mp3', //1s
	    'https://s3.amazonaws.com/asksounds/progressive1/p19.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p20.mp3', //4s
	    'https://s3.amazonaws.com/asksounds/progressive1/p21.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p22.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p23.mp3', //1s
	    'https://s3.amazonaws.com/asksounds/progressive1/p24.mp3', //2s
	    'https://s3.amazonaws.com/asksounds/progressive1/p25.mp3', //1s
	    'https://s3.amazonaws.com/asksounds/progressive1/p26.mp3' //4s
    ],

	ACTIONS : {
	    boop : {
	        id : 0,
	        name : "boop it",
	        audio : "<audio src='https://s3.amazonaws.com/ask-soundlibrary/impacts/amzn_sfx_punch_01.mp3'/>",
	        hex : "#74408A"
	    },
	    twist : {
	        id : 1,
	        name : "twist it",
	        audio : "<audio src='https://s3.amazonaws.com/ask-soundlibrary/foley/amzn_sfx_wooden_door_creaks_open_01.mp3'/>",
	        hex : "#F3C34D"
	    },
	    pull : {
	        id : 2,
	        name : "pull it",
	        audio : "<audio src='https://s3.amazonaws.com/ask-soundlibrary/foley/amzn_sfx_swoosh_fast_1x_01.mp3'/>",
	        hex : "#33B0A9"
	    },
	    spin : {
	        id : 3,
	        name : "spin it",
	        audio : "<audio src='https://s3.amazonaws.com/ask-soundlibrary/scifi/amzn_sfx_scifi_door_open_05.mp3'/>",
	        hex : "#D92824"
	    },
	    flick : {
	        id : 4,
	        name : "flick it",
	        audio : "<audio src='https://s3.amazonaws.com/ask-soundlibrary/cartoon/amzn_sfx_boing_short_1x_01.mp3'/>",
	        hex : "#3FB24D"
	    }
	},

	RECOGNIZERS : {
		"button_down_recognizer" : {
	        "type": "match",
	        "fuzzy": false,
	        "anchor": "end",
	        "pattern": [{
	                "action": "down"
	            }
	        ]
		}
	},

	EVENTS : {
	    "button_down_event": {
	        "meets": ["button_down_recognizer"],
	        "reports": "matches",
	        "shouldEndInputHandler": false
	    },
	    "timeout": {
	        "meets": ["timed out"],
	        "reports": "history",
	        "shouldEndInputHandler": true
	    }
	},

	ROLL_CALL_TIMEOUT : 15000,

	GAME_TIMEOUT : 5000
};

