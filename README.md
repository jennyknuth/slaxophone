# Slaxophone
Play pictionary-telephone on Slack! My personal project for my Galvanize Full-Stack Web Development Course (g8 cohort).

Start a game from Slack with a slash command (/slaxophone) followed by a sentence. The next user receives a DM from slaxophone-bot that includes a prompt to illustrate the original sentence. That user responds to slaxophone-bot's prompt by uploading an image.

![](/MDimages/dogScreenShot.jpg)

And so on as the sentence morphs from "An alien landed on the moon" to "I'm fat Santa" with pictionary-like drawings in between.

At the end of the game, results are rendered to a webpage with a link to an archive of previous games.

<img src="/MDimages/siteScreenshot.png" height=300 width=300)>

A fun team building and creative problem solving activity.

The Slaxophone app captures data coming out of Slack channels both as JSON objects in POST requests and from authorized requests to Slack's real time API.

For example, an initial slash command from Slack sends a POST request to the appropriate route in the Slaxophone app and triggers the app to instantiate a new game, put the message contents in the game's database, configure a new payload, select a new user from the real time API, and match that user with a private channel in Slack

The app sends data back into Slack by sending an appropriate payload through an authenticated API POST request.

Users' replies are captured via slaxophone-bot's DM history in the Slack API.

After the specified number of rounds, the app collects and renders the data to "show" and "index" pages hosted on Heroku and posts the results to a public Slack channel.

Slack was used as a platform for three main reasons: Slack is a place where people are already spending time and interacting, Slack is available on any device, and Slack handles all authorizations.

See an archive of games here:
https://slaxophone.herokuapp.com/games


