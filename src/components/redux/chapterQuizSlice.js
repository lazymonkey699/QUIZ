import { createSlice } from "@reduxjs/toolkit";

const chapterQuizSlice = createSlice({
  name: "chapterQuiz",
  initialState: {
    chapterQuestions: [],
    currentChapterIndex: 0,
    selectedChapterAnswers: {}, // Kept as object per your current setup
    facultyId: null,
    chapterTimeLeft: 1800,
    isChapterSubmitting: false,
    error: null, // Changed to null for consistency (false might imply no error state)
  },
  reducers: {
    setChapterQuestions: (state, action) => {
      state.chapterQuestions = action.payload;
    },
    setFacultyId: (state, action) => {
      state.facultyId = action.payload;
    },
    setSelectedChapterAnswer: (state, action) => {
      const { index, answer } = action.payload;
      state.selectedChapterAnswers[index] = answer;
    },
    setCurrentChapterIndex: (state, action) => {
      state.currentChapterIndex = action.payload;
    },
    incrementChapterIndex: (state) => {
      state.currentChapterIndex += 1;
    },
    decrementChapterIndex: (state) => {
      state.currentChapterIndex -= 1;
    },
    setIsChapterSubmitting: (state, action) => {
      state.isChapterSubmitting = action.payload;
    },
    setChapterTimeLeft: (state, action) => {
      state.chapterTimeLeft = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    resetChapterQuiz: (state) => {
      state.chapterQuestions = [];
      state.currentChapterIndex = 0;
      state.selectedChapterAnswers = {};
      state.facultyId = null;
      state.chapterTimeLeft = 1800;
      state.isChapterSubmitting = false;
      state.error = null;
    },
  },
});

export const {
  setChapterQuestions,
  setFacultyId,
  setSelectedChapterAnswer,
  setCurrentChapterIndex,
  incrementChapterIndex,
  decrementChapterIndex,
  setIsChapterSubmitting,
  setChapterTimeLeft,
  setError,
  resetChapterQuiz,
} = chapterQuizSlice.actions;

export default chapterQuizSlice.reducer;