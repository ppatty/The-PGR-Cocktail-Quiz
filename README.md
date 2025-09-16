# The PGR Cocktail Quiz

A browser-based cocktail knowledge quiz that supports a community leaderboard. Each player completes the quiz individually and can then add their results to a ranked list that can be shared with other participants.

## Getting started

1. Open `index.html` in any modern web browser.
2. Click **Start the Quiz** and answer each multiple-choice question. Feedback appears immediately after every selection.
3. When you finish, enter your name to publish your score to the leaderboard.

## Leaderboard sharing

* The leaderboard is stored locally in your browser. Use the **Export** button to copy a JSON payload that you can share with other players.
* Anyone can import shared data to merge results into their local leaderboard using the **Import** button.
* If your browser blocks local storage, the app will still work, but you will need to export the data before leaving the page to preserve the leaderboard.

## Project structure

* `index.html` – page layout and application markup.
* `styles.css` – visual styling for the quiz and leaderboard.
* `script.js` – quiz logic, scoring, and leaderboard management.
