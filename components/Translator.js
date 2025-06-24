import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import AIModelService from '../services/AIModelService';

export default function Translator() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('ko'); // 한국어
  const [targetLanguage, setTargetLanguage] = useState('vi'); // 베트남어
  const [isTranslating, setIsTranslating] = useState(false);

  // AI 서비스를 사용한 번역 함수
  const translateText = async (text) => {
    if (!text.trim()) {
      Alert.alert('입력 오류', '번역할 텍스트를 입력해주세요.');
      return;
    }

    try {
      setIsTranslating(true);
      const result = await AIModelService.translateText(text, sourceLanguage, targetLanguage);
      setTranslatedText(result.translatedText);
      return result.translatedText;
    } catch (error) {
      console.error('번역 실패:', error);
      Alert.alert('번역 오류', '번역에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const speakText = (text, language) => {
    const voiceLanguage = language === 'ko' ? 'ko-KR' : 'vi-VN';
    Speech.speak(text, {
      language: voiceLanguage,
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const clearAll = () => {
    setSourceText('');
    setTranslatedText('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>베트남어 통역기</Text>
      </View>

      <View style={styles.languageSelector}>
        <Text style={styles.languageText}>
          {sourceLanguage === 'ko' ? '한국어' : 'Tiếng Việt'}
        </Text>
        <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
          <Text style={styles.swapButtonText}>⇄</Text>
        </TouchableOpacity>
        <Text style={styles.languageText}>
          {targetLanguage === 'ko' ? '한국어' : 'Tiếng Việt'}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={sourceLanguage === 'ko' ? '한국어를 입력하세요...' : 'Nhập tiếng Việt...'}
          value={sourceText}
          onChangeText={setSourceText}
          multiline
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => speakText(sourceText, sourceLanguage)}
            disabled={!sourceText}
          >
            <Text style={styles.actionButtonText}>🔊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.translateButton]}
            onPress={() => translateText(sourceText)}
            disabled={!sourceText || isTranslating}
          >
            {isTranslating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={[styles.actionButtonText, styles.loadingText]}>번역 중...</Text>
              </View>
            ) : (
              <Text style={styles.actionButtonText}>🔄 번역</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.outputContainer}>
        <Text style={styles.outputText}>{translatedText}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => speakText(translatedText, targetLanguage)}
            disabled={!translatedText}
          >
            <Text style={styles.actionButtonText}>🔊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={clearAll}
          >
            <Text style={styles.actionButtonText}>지우기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
  },
  languageText: {
    fontSize: 18,
    fontWeight: '600',
  },
  swapButton: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  swapButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#6C757D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  translateButton: {
    backgroundColor: '#007AFF',
    flex: 1,
    marginLeft: 10,
  },
  clearButton: {
    backgroundColor: '#DC3545',
    marginLeft: 10,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  outputContainer: {
    margin: 15,
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    padding: 15,
    minHeight: 120,
  },
  outputText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 15,
    minHeight: 60,
  },
});