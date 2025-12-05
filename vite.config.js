// This Vite config file (vite.config.js) tells Rollup (production bundler) 
// to treat multiple HTML files as entry points so each becomes its own built page.

import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                groupTodoList: resolve(__dirname, "groupTodoList.html"),
                login: resolve(__dirname, "index.html"),
                joinEvent: resolve(__dirname, "joinEvent.html"),
                landing: resolve(__dirname, "landing.html"),
                launchEvent: resolve(__dirname, "launchevent.html"),
                profile: resolve(__dirname, "profile.html"),
                signup: resolve(__dirname, "signup.html"),
                skeleton: resolve(__dirname, "skeleton.html"),
                statistics: resolve(__dirname, "statistics.html"),
                todoList: resolve(__dirname, "todolist.html"),
                userEvents: resolve(__dirname, "userevents.html"),
            }
        }
    }
});


