import { configureStore } from "@reduxjs/toolkit";
import quizReducer from "./quizSlice";
import chapterQuizReducer from "./chapterQuizSlice"; // Add this import

const store = configureStore({
  reducer: {
    quiz: quizReducer,
    chapterQuiz: chapterQuizReducer, // Now this will work
  },
});

export default store;