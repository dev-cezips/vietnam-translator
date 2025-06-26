import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';

const Messenger = ({ onTranslateRequest }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const scrollViewRef = useRef();

  useEffect(() => {
    loadMessages();
    setupAudio();
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('오디오 설정 오류:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('messenger_messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
    }
  };

  const saveMessages = async (updatedMessages) => {
    try {
      await AsyncStorage.setItem('messenger_messages', JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('메시지 저장 오류:', error);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      console.error('녹음 시작 오류:', error);
      Alert.alert('녹음 오류', '녹음을 시작할 수 없습니다.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        const newMessage = {
          id: Date.now().toString(),
          audioUri: uri,
          timestamp: new Date().toISOString(),
          type: 'voice',
          translated: null,
          duration: 0,
        };

        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('녹음 중지 오류:', error);
      Alert.alert('녹음 오류', '녹음을 저장할 수 없습니다.');
    }
  };

  const playAudio = async (audioUri, messageId) => {
    try {
      if (playingAudio) {
        await playingAudio.unloadAsync();
        setPlayingAudio(null);
        setPlayingMessageId(null);
      }

      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      setPlayingAudio(sound);
      setPlayingMessageId(messageId);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAudio(null);
          setPlayingMessageId(null);
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.error('재생 오류:', error);
      Alert.alert('재생 오류', '음성을 재생할 수 없습니다.');
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
      translated: null,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setInputText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const translateMessage = async (message) => {
    if (onTranslateRequest) {
      setIsLoading(true);
      try {
        const translatedText = await onTranslateRequest(message.text);
        
        const updatedMessages = messages.map(msg => 
          msg.id === message.id 
            ? { ...msg, translated: translatedText }
            : msg
        );
        
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
      } catch (error) {
        Alert.alert('번역 오류', '번역 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deleteMessage = (messageId) => {
    Alert.alert(
      '메시지 삭제',
      '이 메시지를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            const updatedMessages = messages.filter(msg => msg.id !== messageId);
            setMessages(updatedMessages);
            saveMessages(updatedMessages);
          }
        }
      ]
    );
  };

  const clearAllMessages = () => {
    Alert.alert(
      '모든 메시지 삭제',
      '모든 메시지를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setMessages([]);
            saveMessages([]);
          }
        }
      ]
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 메신저</Text>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearAllMessages} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>전체 삭제</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>메시지가 없습니다</Text>
            <Text style={styles.emptySubText}>첫 번째 메시지를 보내보세요!</Text>
          </View>
        ) : (
          messages.map((message) => (
            <View key={message.id} style={styles.messageContainer}>
              <View style={styles.messageContent}>
                {message.type === 'voice' ? (
                  <View style={styles.voiceMessageContainer}>
                    <TouchableOpacity
                      onPress={() => playAudio(message.audioUri, message.id)}
                      style={[
                        styles.playButton,
                        playingMessageId === message.id && styles.playButtonActive
                      ]}
                      disabled={playingMessageId === message.id}
                    >
                      <Text style={styles.playButtonText}>
                        {playingMessageId === message.id ? '▶️' : '🎵'}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.voiceMessageInfo}>
                      <Text style={styles.voiceMessageLabel}>음성 메시지</Text>
                      <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.messageText}>{message.text}</Text>
                    <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
                  </>
                )}
              </View>
              
              {message.translated && (
                <View style={styles.translatedContainer}>
                  <Text style={styles.translatedLabel}>번역:</Text>
                  <Text style={styles.translatedText}>{message.translated}</Text>
                </View>
              )}
              
              <View style={styles.messageActions}>
                <TouchableOpacity
                  onPress={() => translateMessage(message)}
                  style={styles.actionButton}
                  disabled={isLoading}
                >
                  <Text style={styles.actionButtonText}>
                    {message.translated ? '재번역' : '번역'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteMessage(message.id)}
                  style={[styles.actionButton, styles.deleteButton]}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="메시지를 입력하세요..."
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[
            styles.voiceButton,
            isRecording && styles.voiceButtonRecording
          ]}
        >
          <Text style={styles.voiceButtonText}>
            {isRecording ? '⏹️' : '🎤'}
          </Text>
          {isRecording && (
            <ActivityIndicator 
              size="small" 
              color="white" 
              style={styles.recordingIndicator}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={sendMessage}
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#343A40',
  },
  clearButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C757D',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#ADB5BD',
  },
  messageContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageContent: {
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: '#343A40',
    lineHeight: 22,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'right',
  },
  translatedContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  translatedLabel: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 4,
  },
  translatedText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 18,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#DC3545',
  },
  deleteButtonText: {
    color: 'white',
  },
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playButtonActive: {
    backgroundColor: '#34C759',
  },
  playButtonText: {
    fontSize: 16,
  },
  voiceMessageInfo: {
    flex: 1,
  },
  voiceMessageLabel: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
  },
  voiceButton: {
    backgroundColor: '#FF3B30',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonRecording: {
    backgroundColor: '#FF9500',
  },
  voiceButtonText: {
    fontSize: 18,
  },
  recordingIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Messenger;