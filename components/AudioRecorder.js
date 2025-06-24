import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import AIModelService from '../services/AIModelService';

export default function AudioRecorder({ onTranscription }) {
  const [recording, setRecording] = useState();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');

  useEffect(() => {
    return recording
      ? () => {
          recording.unloadAsync();
        }
      : undefined;
  }, [recording]);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('권한 필요', '마이크 권한이 필요합니다.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setTranscribedText('');
      setDetectedLanguage('');
    } catch (err) {
      console.error('녹음 시작 실패:', err);
      Alert.alert('오류', '녹음을 시작할 수 없습니다.');
    }
  }

  async function stopRecording() {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      setRecording(undefined);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // AI 서비스를 사용해서 음성을 텍스트로 변환
      const transcriptionResult = await AIModelService.transcribeAudio(uri);
      
      setTranscribedText(transcriptionResult.text);
      setDetectedLanguage(transcriptionResult.language === 'ko' ? '한국어' : '베트남어');
      setIsProcessing(false);
      
      onTranscription({
        text: transcriptionResult.text,
        language: transcriptionResult.language,
        confidence: transcriptionResult.confidence
      });
    } catch (error) {
      console.error('음성 인식 실패:', error);
      setIsProcessing(false);
      Alert.alert('오류', '음성 인식에 실패했습니다.');
    }
  }

  const speakText = (text) => {
    Speech.speak(text, {
      language: 'ko-KR',
      pitch: 1.0,
      rate: 0.8,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isRecording ? '🎤 녹음 중...' : '🎵 음성 인식 준비'}
        </Text>
        {detectedLanguage && (
          <Text style={styles.languageText}>감지된 언어: {detectedLanguage}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.recordButton, 
          isRecording && styles.recording,
          isProcessing && styles.processing
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator color="white" size="small" />
            <Text style={[styles.buttonText, styles.processingText]}>처리 중...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>
            {isRecording ? '🛑 녹음 중지' : '🎤 녹음 시작'}
          </Text>
        )}
      </TouchableOpacity>
      
      {transcribedText ? (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionLabel}>인식된 음성:</Text>
          <Text style={styles.transcriptionText}>{transcribedText}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speakText(transcribedText)}
            >
              <Text style={styles.buttonText}>🔊 음성 재생</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.translateButton}
              onPress={() => onTranscription({
                text: transcribedText,
                language: detectedLanguage === '한국어' ? 'ko' : 'vi',
                shouldTranslate: true
              })}
            >
              <Text style={styles.buttonText}>🔄 번역하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  languageText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  recordButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 50,
    marginBottom: 30,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recording: {
    backgroundColor: '#FF3B30',
    transform: [{ scale: 1.05 }],
  },
  processing: {
    backgroundColor: '#FF9500',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingText: {
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transcriptionContainer: {
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transcriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  transcriptionText: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 24,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  speakButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  translateButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
});