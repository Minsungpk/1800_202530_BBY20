# Timely

## Overview

Elmo Hikes is a client-side JavaScript web application that helps users discover and explore hiking trails. The app displays a curated list of hike trails, each with details such as name, location, difficulty, and an image. Users can browse the list and mark their favorite trails for easy access later.

Developed for the COMP 1800 course, this project applies User-Centred Design practices and agile project management, and demonstrates integration with Firebase backend services for storing user favorites.

---

## Features

- Browse a list of curated hiking trails with images and details
- Mark and unmark trails as favorites
- View a personalized list of favorite hikes
- Responsive design for desktop and mobile

---

## Technologies Used

Example:

- **Frontend**: HTML, CSS, JavaScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend**: Firebase for hosting
- **Database**: Firestore

---

## Usage

1. Open your browser and visit `http://localhost:3000`.
2. Browse the list of hiking trails displayed on the main page.
3. Click the heart icon (or similar) to mark a trail as a favorite.
4. View your favorite hikes in the favorites section.

---

## Project Structure

```
elmo-hikes/
├── src/
│   ├── main.js
├── styles/
│   └── style.css
├── public/
├── images/
├── index.html
├── package.json
├── README.md
```

---


## Contributors 
- **Abhia** - BCIT CST student, likes going out, shopping and drinking iced coffee.
- **Minsung** - BCIT CST Student with a passion for coding and inventing something new. Fun fact:I like modifiying cars and going for a cruise.
- **Jessie Yuen** - BCIT CST Student with an enthusiasm for arts and shopping. Enjoys the great outdoors.
- **Faida** - BCIT CST Student who likes video games.
---

## Acknowledgments

- Trail data and images are for demonstration purposes only.
- Code snippets were adapted from resources such as [Stack Overflow](https://stackoverflow.com/) and [MDN Web Docs](https://developer.mozilla.org/).
- Icons sourced from [FontAwesome](https://fontawesome.com/) and images from [Unsplash](https://unsplash.com/).

---

## Limitations and Future Work

### Limitations

- Limited trail details (e.g., no live trail conditions).
- Accessibility features can be further improved.

### Future Work

- Implement map view and trailhead directions.
- Add filtering and sorting options (e.g., by difficulty, distance).
- Create a dark mode for better usability in low-light conditions.

## Statistics & Rewards (new)

This project now includes a basic statistics and rewards system backed by Firestore.

- Events: user actions are stored in a top-level `events` collection. Each document has:
	- `userUid` (string)
	- `type` ("arrival" | "completion")
	- `timestamp` (serverTimestamp)
	- `meta` (object with taskId, scheduledTime, onTime, locationId, etc.)

- Rewards: each user has a `userRewards/{uid}` document that tracks `points` earned.
	- Completions award 10 points.
	- On-time arrivals award 20 points.

Deployment notes
- Make sure Firestore is enabled for the Firebase project in `src/firebaseConfig.js` and deploy the rules in `firestore.rules` before testing the feature. If you manage the Firebase project from the CLI:

```bash
firebase deploy --only firestore:rules --project <your-project-id>
```

Security
- Firestore rules restrict both `events` and `userRewards` so users can only create/read/update their own documents. See `firestore.rules` for full details.

Testing
- Use the "Seed sample data" button on `statistics.html` to populate sample events and points for quick testing.


---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
