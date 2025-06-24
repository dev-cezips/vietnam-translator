import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

export default function AudioRecorder({ onTranscription }) {
  const [recording, setRecording] = useState();
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');

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
    } catch (err) {
      console.error('녹음 시작 실패:', err);
    }
  }

  async function stopRecording() {
    setIsRecording(false);
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    
    const uri = recording.getURI();
    
    // 여기서 whisper.cpp로 음성을 텍스트로 변환
    // 현재는 임시로 더미 텍스트 사용
    const dummyTranscription = "안녕하세요, 이것은 테스트 음성입니다.";
    setTranscribedText(dummyTranscription);
    onTranscription(dummyTranscription);
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
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recording]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? '녹음 중지' : '녹음 시작'}
        </Text>
      </TouchableOpacity>
      
      {transcribedText ? (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionText}>{transcribedText}</Text>
          <TouchableOpacity
            style={styles.speakButton}
            onPress={() => speakText(transcribedText)}
          >
            <Text style={styles.buttonText}>음성 재생</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  recording: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transcriptionContainer: {
    backgroundColor: '#F2F2F7',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
  },
  transcriptionText: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  speakButton: {
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});