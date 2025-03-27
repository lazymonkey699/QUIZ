// quizSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  questions: [],
  currentIndex: 0,
  selectedAnswers: {},
  facultyId: null,
  timeLeft: 3600, // 60 minutes
  isSubmitting: false,
  isError: false,
};

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setQuestions: (state, action) => {
      state.questions = action.payload;
    },
    setFacultyId: (state, action) => {
      state.facultyId = action.payload;
    },
    setSelectedAnswer: (state, action) => {
      const { index, answer } = action.payload;
      state.selectedAnswers[index] = answer;
    },
    incrementIndex: (state) => {
      if (state.currentIndex < state.questions.length - 1) {
        state.currentIndex++;
      }
    },
    decrementIndex: (state) => {
      if (state.currentIndex > 0) {
        state.currentIndex--;
      }
    },
    setCurrentIndex: (state, action) => {
      if (action.payload >= 0 && action.payload < state.questions.length) {
        state.currentIndex = action.payload;
      }
    },
    setIsSubmitting: (state, action) => {
      state.isSubmitting = action.payload;
    },
    setTimeLeft: (state, action) => {
      state.timeLeft = action.payload;
    },
    setError: (state, action) => {
      state.isError = action.payload;
    },
  },
});

export const {
  setQuestions,
  setFacultyId,
  setSelectedAnswer,
  incrementIndex,
  decrementIndex,
  setCurrentIndex,
  setIsSubmitting,
  setTimeLeft,
  setError,
} = quizSlice.actions;

export default quizSlice.reducer;