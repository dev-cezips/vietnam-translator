import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

class AIModelService {
  constructor() {
    this.whisperModelPath = null;
    this.llamaModelPath = null;
    this.modelsDir = FileSystem.documentDirectory + 'models/';
    this.initializeModels();
  }

  async initializeModels() {
    try {
      // 모델 디렉토리 생성
      const dirInfo = await FileSystem.getInfoAsync(this.modelsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.modelsDir, { intermediates: true });
      }

      // 모델 파일 확인
      await this.checkModelFiles();
    } catch (error) {
      console.error('모델 초기화 실패:', error);
    }
  }

  async checkModelFiles() {
    const whisperModelFile = this.modelsDir + 'ggml-base.bin';
    const llamaModelFile = this.modelsDir + 'llama-7b-chat-q4_0.bin';

    const whisperExists = await FileSystem.getInfoAsync(whisperModelFile);
    const llamaExists = await FileSystem.getInfoAsync(llamaModelFile);

    if (!whisperExists.exists) {
      console.log('Whisper 모델이 필요합니다.');
      // 실제 환경에서는 모델 다운로드 로직 구현
    } else {
      this.whisperModelPath = whisperModelFile;
    }

    if (!llamaExists.exists) {
      console.log('LLaMA 모델이 필요합니다.');
      // 실제 환경에서는 모델 다운로드 로직 구현
    } else {
      this.llamaModelPath = llamaModelFile;
    }
  }

  async downloadModel(modelType, url, fileName) {
    try {
      const downloadPath = this.modelsDir + fileName;
      
      Alert.alert(
        '모델 다운로드',
        `${modelType} 모델을 다운로드하시겠습니까? (약 100-500MB)`
      );

      // 실제 환경에서는 FileSystem.downloadAsync 사용
      // const downloadResult = await FileSystem.downloadAsync(url, downloadPath);
      
      console.log(`${modelType} 모델 다운로드 완료: ${downloadPath}`);
      
      if (modelType === 'whisper') {
        this.whisperModelPath = downloadPath;
      } else if (modelType === 'llama') {
        this.llamaModelPath = downloadPath;
      }

      return downloadPath;
    } catch (error) {
      console.error('모델 다운로드 실패:', error);
      throw error;
    }
  }

  // 음성을 텍스트로 변환 (Whisper.cpp 시뮬레이션)
  async transcribeAudio(audioPath) {
    try {
      // 실제 환경에서는 whisper.cpp 네이티브 모듈 호출
      // 현재는 시뮬레이션
      console.log('음성 인식 중...', audioPath);
      
      // 더미 음성 인식 결과
      const dummyResults = [
        '안녕하세요, 오늘 날씨가 좋네요.',
        '밥 먹었어요?',
        '어디 가세요?',
        '고마워요.',
        '사랑해요.',
        'Xin chào, hôm nay thời tiết đẹp.',
        'Ăn cơm chưa?',
        'Đi đâu vậy?',
        'Cảm ơn.',
        'Anh yêu em.'
      ];

      // 랜덤 결과 반환 (실제로는 whisper.cpp 결과)
      const result = dummyResults[Math.floor(Math.random() * dummyResults.length)];
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // 처리 시간 시뮬레이션
      
      return {
        text: result,
        language: this.detectLanguage(result),
        confidence: 0.95
      };
    } catch (error) {
      console.error('음성 인식 실패:', error);
      throw error;
    }
  }

  // 텍스트 번역 (LLaMA.cpp 시뮬레이션)
  async translateText(text, fromLang, toLang) {
    try {
      console.log(`번역 중: ${text} (${fromLang} -> ${toLang})`);
      
      // 실제 환경에서는 llama.cpp 네이티브 모듈 호출
      const translations = {
        'ko-vi': {
          '안녕하세요': 'Xin chào',
          '안녕하세요, 오늘 날씨가 좋네요.': 'Xin chào, hôm nay thời tiết đẹp.',
          '밥 먹었어요?': 'Ăn cơm chưa?',
          '어디 가세요?': 'Đi đâu vậy?',
          '고마워요': 'Cảm ơn',
          '고마워요.': 'Cảm ơn.',
          '사랑해요': 'Anh yêu em',
          '사랑해요.': 'Anh yêu em.',
          '어디 가요?': 'Đi đâu vậy?',
          '좋은 아침입니다': 'Chào buổi sáng',
          '잘 자요': 'Chúc ngủ ngon',
          '도와주세요': 'Xin hãy giúp tôi',
          '얼마예요?': 'Bao nhiêu tiền?',
          '화장실이 어디에 있어요?': 'Toilet ở đâu?'
        },
        'vi-ko': {
          'Xin chào': '안녕하세요',
          'Xin chào, hôm nay thời tiết đẹp.': '안녕하세요, 오늘 날씨가 좋네요.',
          'Ăn cơm chưa?': '밥 먹었어요?',
          'Đi đâu vậy?': '어디 가세요?',
          'Cảm ơn': '고마워요',
          'Cảm ơn.': '고마워요.',
          'Anh yêu em': '사랑해요',
          'Anh yêu em.': '사랑해요.',
          'Chào buổi sáng': '좋은 아침입니다',
          'Chúc ngủ ngon': '잘 자요',
          'Xin hãy giúp tôi': '도와주세요',
          'Bao nhiêu tiền?': '얼마예요?',
          'Toilet ở đâu?': '화장실이 어디에 있어요?'
        }
      };

      const langPair = `${fromLang}-${toLang}`;
      let result = translations[langPair]?.[text];
      
      if (!result) {
        // 간단한 단어 번역 시도
        result = `[AI 번역] ${text}`;
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // 번역 시간 시뮬레이션

      return {
        translatedText: result,
        originalText: text,
        fromLanguage: fromLang,
        toLanguage: toLang,
        confidence: 0.92
      };
    } catch (error) {
      console.error('번역 실패:', error);
      throw error;
    }
  }

  // 언어 감지
  detectLanguage(text) {
    // 간단한 언어 감지 로직
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/;
    
    if (koreanRegex.test(text)) {
      return 'ko';
    } else if (vietnameseRegex.test(text)) {
      return 'vi';
    } else {
      return 'unknown';
    }
  }

  // 모델 상태 확인
  getModelStatus() {
    return {
      whisper: {
        loaded: !!this.whisperModelPath,
        path: this.whisperModelPath
      },
      llama: {
        loaded: !!this.llamaModelPath,
        path: this.llamaModelPath
      }
    };
  }
}

export default new AIModelService();