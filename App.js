import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import Translator from './components/Translator';
import AudioRecorder from './components/AudioRecorder';

export default function App() {
  const [currentTab, setCurrentTab] = useState('translator');

  const handleTranscription = (text) => {
    console.log('음성 인식 결과:', text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'translator' && styles.activeTab]}
          onPress={() => setCurrentTab('translator')}
        >
          <Text style={[styles.tabText, currentTab === 'translator' && styles.activeTabText]}>
            번역기
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'recorder' && styles.activeTab]}
          onPress={() => setCurrentTab('recorder')}
        >
          <Text style={[styles.tabText, currentTab === 'recorder' && styles.activeTabText]}>
            음성인식
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {currentTab === 'translator' ? (
          <Translator />
        ) : (
          <AudioRecorder onTranscription={handleTranscription} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
});
