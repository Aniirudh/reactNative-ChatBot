import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

const SentimentAnalysis = () => {
  const [model, setModel] = useState(null);
  const [indexFrom, setIndexFrom] = useState(null);
  const [maxLen, setMaxLen] = useState(null);
  const [wordIndex, setWordIndex] = useState(null);
  const [vocabularySize, setVocabularySize] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const loadModelAndMetadata = async () => {
    try {
      console.log('Loading model');

      // Wait for TensorFlow.js to be ready
      await tf.ready();

      // Set the fetch function to the default fetch provided by React Native
      tf.io.registerLoadRouter((url) => {
        if (url.startsWith('https://')) {
          return fetch(url, { method: 'GET' }).then((response) => response.arrayBuffer());
        }
        return null;
      });

      const modelUrl = 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json';

      const loadedModel = await fetch(modelUrl)
        .then((response) => response.json())
        .then((model) => tf.loadLayersModel(tf.io.fromMemory(model)))
        .catch((error) => {
          console.error('Error loading model:', error);
          throw error;
        });

      setModel(loadedModel);

      const sentimentMetadata = await getMeta('https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json');

      setIndexFrom(sentimentMetadata['index_from']);
      setMaxLen(sentimentMetadata['max_len']);
      setWordIndex(sentimentMetadata['word_index']);
      setVocabularySize(sentimentMetadata['vocabulary_size']);

      setLoading(false); // Set loading to false once everything is loaded
      console.log('Loaded model');
    } catch (error) {
      console.error('Error loading model or metadata:', error);
      setLoading(false); // Set loading to false in case of an error
    }
  };

  loadModelAndMetadata();
}, []);


  const padSequences = (sequence, maxLen, padding = 'pre', truncating = 'pre', value = 0) => {
  let paddedSequence = sequence.slice(0, maxLen);

  if (padding === 'pre') {
    paddedSequence = Array.from({ length: maxLen - sequence.length }, () => value).concat(paddedSequence);
  } else {
    paddedSequence = paddedSequence.concat(Array.from({ length: maxLen - sequence.length }, () => value));
  }

  return paddedSequence;
};


const predictions = async () => {
  if (loading) {
    console.error('Model or metadata is still loading.');
    return;
  }

  if (!model || !indexFrom || !maxLen || !wordIndex || !vocabularySize) {
    console.error('Model or metadata not loaded yet.');
    return;
  }

  const inputText = searchText.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ');
  console.log('Input Text:', inputText);

  const sequence = inputText.map((word) => {
    console.log('word:', word);
    let wordIndexValue = wordIndex[word] + indexFrom;
    if (wordIndexValue > vocabularySize) {
      wordIndexValue = 2;
    }
    console.log('wordIndexValue:', wordIndexValue);
    return wordIndexValue;
  });

  const paddedSequence = padSequences(sequence, maxLen);
  console.log('Padded Sequence:', paddedSequence, typeof(paddedSequence));
  console.log('Padded Sequence Length:', paddedSequence.length);

  // Convert the paddedSequence to Int32Array
  const inputArray = Int32Array.from(paddedSequence);

  // Create a tensor from the Int32Array
  const input = tf.tensor([Array.from(inputArray)], [1, maxLen], 'int32'); // Fix here

  console.log('Input Tensor:', input);
  console.log('Input Shape:', input.shape); // Log the shape for debugging

  // Wrap the prediction code in a try-catch block to handle errors
  try {
    const beginMs = performance.now();
    const predictOut = model.predict(input); // Fix here

    const score = predictOut.dataSync()[0];
    predictOut.dispose();
    const endMs = performance.now();

    console.log('Predicted Score:', score);
    console.log('Prediction successful');
  } catch (error) {
    console.error('Error during prediction:', error);
  }
};


  const getMeta = async (path) => {
    const response = await fetch(path);
    const data = await response.json();
    return data;
  };

  return (
    <View>
      <Text>Input Text:</Text>
      <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
        onChangeText={(text) => setSearchText(text)}
        value={searchText}
      />
      <Button title="Predict Sentiment" onPress={predictions} />
      {loading && <ActivityIndicator size="large" color="#0000" />}
    </View>
  );
};

export default SentimentAnalysis;