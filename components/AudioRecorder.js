import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import AIModelService from '../services/AIModelService';

export default function AudioRecorder({ onTranscription }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('checking');
  const [showTestInput, setShowTestInput] = useState(false);
  const [testText, setTestText] = useState('');

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    return () => {
      if (recording && typeof recording.unloadAsync === 'function') {
        recording.unloadAsync().catch(console.error);
      }
    };
  }, [recording]);

  const checkPermissions = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      setPermissionStatus(status);
      console.log('현재 마이크 권한 상태:', status);
    } catch (error) {
      console.error('권한 확인 오류:', error);
      setPermissionStatus('undetermined');
    }
  };

  async function startRecording() {
    try {
      console.log('녹음 시작 시도...');
      
      // 권한 요청
      const permission = await Audio.requestPermissionsAsync();
      console.log('마이크 권한 상태:', permission);
      
      if (permission.status !== 'granted') {
        setPermissionStatus(permission.status);
        Alert.alert(
          '마이크 권한 필요', 
          '음성 인식을 위해 마이크 권한을 허용해주세요.\n\n설정 > 앱 > Expo Go > 권한에서 마이크를 허용하세요.',
          [
            { text: '취소', style: 'cancel' },
            { text: '다시 시도', onPress: () => checkPermissions() },
            { text: '설정으로 이동', onPress: () => {
              Alert.alert('권한 설정', '휴대폰 설정에서 Expo Go 앱의 마이크 권한을 허용한 후 다시 시도해주세요.');
            }}
          ]
        );
        return;
      }

      setPermissionStatus('granted');

      console.log('오디오 모드 설정 중...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      console.log('녹음 객체 생성 중...');
      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      console.log('녹음 시작 성공');
      
      setRecording(recording);
      setIsRecording(true);
      setTranscribedText('');
      setDetectedLanguage('');
    } catch (err) {
      console.error('녹음 시작 실패:', err);
      Alert.alert(
        '녹음 오류', 
        `녹음을 시작할 수 없습니다.\n\n오류: ${err.message}\n\n마이크 권한을 확인하고 다시 시도해주세요.`
      );
    }
  }

  async function stopRecording() {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      if (!recording) {
        setIsProcessing(false);
        Alert.alert('오류', '녹음 객체를 찾을 수 없습니다.');
        return;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(undefined);
      
      // AI 서비스를 사용해서 음성을 텍스트로 변환
      const transcriptionResult = await AIModelService.transcribeAudio(uri);
      
      setTranscribedText(transcriptionResult.text);
      setDetectedLanguage(AIModelService.getLanguageName(transcriptionResult.language));
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
    // 감지된 언어에 따라 TTS 언어 설정
    const languageCodeMap = {
      '한국어': 'ko-KR',
      'Tiếng Việt': 'vi-VN',
      '繁體中文': 'zh-TW',
      'English': 'en-US'
    };
    
    const ttsLanguage = languageCodeMap[detectedLanguage] || 'ko-KR';
    
    Speech.speak(text, {
      language: ttsLanguage,
      pitch: 1.0,
      rate: 0.8,
    });
  };

  // 테스트용 더미 음성 인식 함수
  const testVoiceRecognition = async () => {
    setIsProcessing(true);
    
    try {
      // AI 서비스를 사용해서 더미 음성 인식 시뮬레이션
      const transcriptionResult = await AIModelService.transcribeAudio('test_audio');
      
      setTranscribedText(transcriptionResult.text);
      setDetectedLanguage(AIModelService.getLanguageName(transcriptionResult.language));
      setIsProcessing(false);
      
      onTranscription({
        text: transcriptionResult.text,
        language: transcriptionResult.language,
        confidence: transcriptionResult.confidence
      });
    } catch (error) {
      console.error('테스트 음성 인식 실패:', error);
      setIsProcessing(false);
      Alert.alert('오류', '테스트에 실패했습니다.');
    }
  };

  // 사용자 입력 텍스트로 테스트
  const testWithCustomText = async () => {
    if (!testText.trim()) {
      Alert.alert('입력 오류', '테스트할 텍스트를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // 처리 시간 시뮬레이션
      
      const detectedLang = AIModelService.detectLanguage(testText);
      
      setTranscribedText(testText);
      setDetectedLanguage(AIModelService.getLanguageName(detectedLang));
      setIsProcessing(false);
      setShowTestInput(false);
      setTestText('');
      
      onTranscription({
        text: testText,
        language: detectedLang,
        confidence: 0.95
      });
    } catch (error) {
      console.error('커스텀 텍스트 테스트 실패:', error);
      setIsProcessing(false);
      Alert.alert('오류', '테스트에 실패했습니다.');
    }
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
        {permissionStatus !== 'granted' && (
          <View style={styles.permissionWarning}>
            <Text style={styles.permissionWarningText}>
              ⚠️ 마이크 권한이 필요합니다
            </Text>
            <Text style={styles.permissionInstructionText}>
              설정에서 Expo Go 앱의 마이크 권한을 허용해주세요
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.recordButton, 
          isRecording && styles.recording,
          isProcessing && styles.processing
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || (permissionStatus !== 'granted' && !isRecording)}
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

      {/* 테스트 버튼들 (마이크 권한이 없을 때) */}
      {permissionStatus !== 'granted' && (
        <View style={styles.testButtonsContainer}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={testVoiceRecognition}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>
              🧪 랜덤 테스트
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, styles.customTestButton]}
            onPress={() => setShowTestInput(true)}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>
              ✏️ 직접 입력 테스트
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
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
              onPress={() => {
                // 언어 코드 매핑
                const languageCodeMap = {
                  '한국어': 'ko',
                  'Tiếng Việt': 'vi',
                  '繁體中文': 'zh-TW',
                  'English': 'en'
                };
                
                onTranscription({
                  text: transcribedText,
                  language: languageCodeMap[detectedLanguage] || 'ko',
                  shouldTranslate: true
                });
              }}
            >
              <Text style={styles.buttonText}>🔄 번역하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* 텍스트 입력 모달 */}
      <Modal
        visible={showTestInput}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTestInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>음성 인식 테스트</Text>
            <Text style={styles.modalSubtitle}>
              음성으로 말할 텍스트를 직접 입력해보세요
            </Text>
            
            <TextInput
              style={styles.testInput}
              placeholder="예: 사랑해, 안녕하세요, Hello..."
              value={testText}
              onChangeText={setTestText}
              multiline={false}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowTestInput(false);
                  setTestText('');
                }}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={testWithCustomText}
                disabled={!testText.trim()}
              >
                <Text style={styles.confirmButtonText}>테스트</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  permissionWarning: {
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    alignItems: 'center',
  },
  permissionWarningText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
    textAlign: 'center',
  },
  permissionInstructionText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
  },
  testButtonsContainer: {
    marginTop: 15,
    gap: 10,
  },
  testButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  customTestButton: {
    backgroundColor: '#17A2B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  testInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    backgroundColor: '#6C757D',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});