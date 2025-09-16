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

## Customising the question set

* Open `admin.html` and enter the admin password `mixology-master` to unlock the editor.
* Add, edit, or remove questions and answer options. Each question needs at least two options and one correct answer.
* Click **Save changes** to write the updated deck to your browser. Refresh `index.html` for players to see the new content.
* Custom question sets are stored in local storage on the current device. Use your browser's export tools to back up the data if storage is disabled.

## Project structure

* `index.html` – page layout and application markup.
* `styles.css` – visual styling for the quiz and leaderboard.
* `script.js` – quiz logic, scoring, and leaderboard management.
* `data-store.js` – shared helpers for default quiz content and storage.
* `admin.html` – password-protected editor for managing question content.
* `admin.js` – admin UI logic for editing and saving question sets.
