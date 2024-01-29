// App.js
import React from 'react';
import { SafeAreaView } from 'react-native';
import SentimentAnalysis from './src/model/sentimentAnalysis';

const App = () => {
  return (
    <SafeAreaView>
      <SentimentAnalysis />
    </SafeAreaView>
  );
};

export default App;