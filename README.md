# Timely

## Overview

Our team BBY20 is developing Timely, a mobile application to help students and adults improve their time management when they plan to meet up with their friends and peers with a system that tracks each other’s progress to prepare for any shared schedule. 

Developed for the COMP 1800 course, this project applies User-Centred Dmesign practices and agile project management, and demonstrates integration with Firebase backend services for storing user favorites.


---


## Features

- View you and your friends live locations on the map
- Create personal and group to-do lists to help you and your friends stay on top of upcoming tasks
- Host an event and invite others to join
- Check you task completion statistics to see how many can be finished before the deadline and earn rewards.


---


## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend**: Firebase for hosting
- **Database**: Firestore
- **APIs**: Map rendered with [MapLibreGLJS](https://maplibre.org/) using tiles from [MapTiler](https://www.maptiler.com/)
- **APIs**: Geocoding/autocomplete functionality for location search from [StadiaMaps](https://stadiamaps.com/)


---


## Usage

1. Open your browser and visit `https://group-project-8a6ee.web.app/`.
2. View both your own and others’ real-time locations displayed on the map.
3. Click the plus icon to create a to-do list, group to-do list, or an event.
4. Fill out all necessary fields to launch a to-do list.
5. Tasks will now display on the page, and each one includes a checkbox to mark as completed.
6.  For a group to-do list, add users by email for them to join the group.
7. Add details and tasks to launch a group to-do list.
8. To host a new event, provide all necessary information, including the location.
9. Navigate to the dashboard to view all available events to join.
10. Navigate to the profile page and click the second icon in the top left corner to view all joined events.
11. On the same page, add as user's email to add them as a friend. 
12. View sent friend requests and incoming friend requests on the bottom of the page.


---


## Project Structure

```
1800_202530_BBY20/
├── .firebase/
│   └── hosting.ZGlzdA.cache
├── .vscode/
│   └── settings.json
├── dist/
├── node_modules/
├── public/
│   ├── images/
│   └── bottom-window.js
├── src/
│   ├── app.jsx
│   ├── auth2.js
│   ├── firebaseConfig.js
│   ├── friends.js
│   ├── groupTodo.js
│   ├── joinEvent.js
│   ├── launchEvent.js
│   ├── loginpage.jsx
│   ├── logout.js
│   ├── main.jsx
│   ├── mainpage.jsx
│   ├── map.js
│   ├── newUser.js
│   ├── statistics.js
│   └── userevents.js
├── styles/
│   ├── grouptodolist.css
│   ├── joinevent.css
│   ├── landing.css
│   ├── launchevent.css
│   ├── loginpage.css
│   ├── profile.css
│   ├── statistics.css
│   ├── style.css
│   ├── todolist.css
│   └── userevents.css
├── .firebaserc
├── .gitignore
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── groupTodoList.html
├── index.html
├── joinEvent.html
├── landing.html
├── launchevent.html
├── package-lock.json
├── package.json
├── profile.html
├── README.md
├── signup.html
├── skeleton.html
├── statistics.html
├── todolist.html
├── userevents.html
└── vite.config.js

```

---


## Contributors 
- **Abhia** - BCIT CST student, likes going out, shopping and drinking iced coffee.
- **Minsung** - BCIT CST Student with a passion for coding and inventing something new. Fun fact:I like modifiying cars and going for a cruise.
- **Jessie Yuen** - BCIT CST Student with an enthusiasm for arts and shopping. Enjoys the great outdoors.
- **Faida** - BCIT CST Student who likes video games.


---


## Acknowledgments

- AI tools such as [ChatGPT](https://chatgpt.com/) were used for debugging, explainations, and code suggestions for portions of this project. 
- Icons sourced from [Bootstrap](https://icons.getbootstrap.com/) and [Flaticon](https://www.flaticon.com/).


---


## Limitations and Future Work

### Limitations

- Events do not appear on the map.
- Notifications/Alerts are not implemented.

### Future Work

- Events show up on the map.
- Add notifications to alert users of upcoming deadlines.
- Personal and group tasks are displayed together on a separate page or on the dashboard.


---


## License

This project is licensed under the MIT License. See the LICENSE file for details.
