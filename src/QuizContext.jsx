import React, { createContext, useState, useContext } from 'react';

const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [quizState, setQuizState] = useState('inactive');

  return (
    <QuizContext.Provider value={{ questions, setQuestions, quizState, setQuizState }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => useContext(QuizContext);