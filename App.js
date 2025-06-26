import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text, ScrollView, Alert } from 'react-native';
import Translator from './components/Translator';
import AudioRecorder from './components/AudioRecorder';
import VideoCall from './components/VideoCall';
import Messenger from './components/Messenger';
import AIModelService from './services/AIModelService';

export default function App() {
  const [currentTab, setCurrentTab] = useState('translator');

  const handleTranscription = (transcriptionData) => {
    console.log('음성 인식 결과:', transcriptionData);
    
    // 음성 인식 결과를 번역 탭으로 전달하는 로직을 추가할 수 있음
    if (transcriptionData.shouldTranslate) {
      setCurrentTab('translator');
      // 번역기 컴포넌트에 텍스트 전달하는 로직 추가 가능
    }
  };

  const handleTranslateRequest = async (text, sourceLanguage = 'ko', targetLanguage = 'vi') => {
    try {
      const result = await AIModelService.translateText(text, sourceLanguage, targetLanguage);
      return result.translatedText;
    } catch (error) {
      console.error('번역 실패:', error);
      Alert.alert('번역 오류', '번역에 실패했습니다. 다시 시도해주세요.');
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContentContainer}
      >
        <TouchableOpacity
          style={[styles.tab, currentTab === 'translator' && styles.activeTab]}
          onPress={() => setCurrentTab('translator')}
        >
          <Text style={[styles.tabText, currentTab === 'translator' && styles.activeTabText]}>
            📝 번역기
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'recorder' && styles.activeTab]}
          onPress={() => setCurrentTab('recorder')}
        >
          <Text style={[styles.tabText, currentTab === 'recorder' && styles.activeTabText]}>
            🎤 음성인식
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'videocall' && styles.activeTab]}
          onPress={() => setCurrentTab('videocall')}
        >
          <Text style={[styles.tabText, currentTab === 'videocall' && styles.activeTabText]}>
            📹 화상통화
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'messenger' && styles.activeTab]}
          onPress={() => setCurrentTab('messenger')}
        >
          <Text style={[styles.tabText, currentTab === 'messenger' && styles.activeTabText]}>
            💬 메신저
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.content}>
        {currentTab === 'translator' && <Translator />}
        {currentTab === 'recorder' && <AudioRecorder onTranscription={handleTranscription} />}
        {currentTab === 'videocall' && <VideoCall onTranscription={handleTranscription} />}
        {currentTab === 'messenger' && <Messenger onTranslateRequest={handleTranslateRequest} />}
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
    backgroundColor: 'white',
    paddingTop: 10,
    maxHeight: 60,
  },
  tabContentContainer: {
    paddingHorizontal: 10,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minWidth: 120,
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
