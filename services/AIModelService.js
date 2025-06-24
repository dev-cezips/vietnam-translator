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
      
      // 더미 음성 인식 결과 (4개 언어)
      const dummyResults = [
        // 한국어
        '안녕하세요, 오늘 날씨가 좋네요.',
        '밥 먹었어요?',
        '어디 가세요?',
        '고마워요.',
        '사랑해요.',
        // 베트남어
        'Xin chào, hôm nay thời tiết đẹp.',
        'Ăn cơm chưa?',
        'Đi đâu vậy?',
        'Cảm ơn.',
        'Anh yêu em.',
        // 대만어 (번체 중국어)
        '你好，今天天氣真好。',
        '吃飯了嗎？',
        '你要去哪裡？',
        '謝謝。',
        '我愛你。',
        // 영어
        'Hello, the weather is nice today.',
        'Did you eat?',
        'Where are you going?',
        'Thank you.',
        'I love you.'
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
        // 한국어 -> 베트남어
        'ko-vi': {
          '안녕하세요': 'Xin chào',
          '안녕하세요, 오늘 날씨가 좋네요.': 'Xin chào, hôm nay thời tiết đẹp.',
          '밥 먹었어요?': 'Ăn cơm chưa?',
          '어디 가세요?': 'Đi đâu vậy?',
          '고마워요': 'Cảm ơn',
          '사랑해요': 'Anh yêu em',
          '좋은 아침입니다': 'Chào buổi sáng',
          '잘 자요': 'Chúc ngủ ngon',
          '도와주세요': 'Xin hãy giúp tôi',
          '얼마예요?': 'Bao nhiêu tiền?',
          '화장실이 어디에 있어요?': 'Toilet ở đâu?'
        },
        // 베트남어 -> 한국어
        'vi-ko': {
          'Xin chào': '안녕하세요',
          'Xin chào, hôm nay thời tiết đẹp.': '안녕하세요, 오늘 날씨가 좋네요.',
          'Ăn cơm chưa?': '밥 먹었어요?',
          'Đi đâu vậy?': '어디 가세요?',
          'Cảm ơn': '고마워요',
          'Anh yêu em': '사랑해요',
          'Chào buổi sáng': '좋은 아침입니다',
          'Chúc ngủ ngon': '잘 자요',
          'Xin hãy giúp tôi': '도와주세요',
          'Bao nhiêu tiền?': '얼마예요?',
          'Toilet ở đâu?': '화장실이 어디에 있어요?'
        },
        // 한국어 -> 대만어
        'ko-zh-TW': {
          '안녕하세요': '你好',
          '안녕하세요, 오늘 날씨가 좋네요.': '你好，今天天氣真好。',
          '밥 먹었어요?': '吃飯了嗎？',
          '어디 가세요?': '你要去哪裡？',
          '고마워요': '謝謝',
          '사랑해요': '我愛你',
          '좋은 아침입니다': '早安',
          '잘 자요': '晚安',
          '도와주세요': '請幫助我',
          '얼마예요?': '多少錢？',
          '화장실이 어디에 있어요?': '廁所在哪裡？'
        },
        // 대만어 -> 한국어
        'zh-TW-ko': {
          '你好': '안녕하세요',
          '你好，今天天氣真好。': '안녕하세요, 오늘 날씨가 좋네요.',
          '吃飯了嗎？': '밥 먹었어요?',
          '你要去哪裡？': '어디 가세요?',
          '謝謝': '고마워요',
          '我愛你': '사랑해요',
          '早安': '좋은 아침입니다',
          '晚安': '잘 자요',
          '請幫助我': '도와주세요',
          '多少錢？': '얼마예요?',
          '廁所在哪裡？': '화장실이 어디에 있어요?'
        },
        // 한국어 -> 영어
        'ko-en': {
          '안녕하세요': 'Hello',
          '안녕하세요, 오늘 날씨가 좋네요.': 'Hello, the weather is nice today.',
          '밥 먹었어요?': 'Did you eat?',
          '어디 가세요?': 'Where are you going?',
          '고마워요': 'Thank you',
          '사랑해요': 'I love you',
          '좋은 아침입니다': 'Good morning',
          '잘 자요': 'Good night',
          '도와주세요': 'Please help me',
          '얼마예요?': 'How much is it?',
          '화장실이 어디에 있어요?': 'Where is the bathroom?'
        },
        // 영어 -> 한국어
        'en-ko': {
          'Hello': '안녕하세요',
          'Hello, the weather is nice today.': '안녕하세요, 오늘 날씨가 좋네요.',
          'Did you eat?': '밥 먹었어요?',
          'Where are you going?': '어디 가세요?',
          'Thank you': '고마워요',
          'I love you': '사랑해요',
          'Good morning': '좋은 아침입니다',
          'Good night': '잘 자요',
          'Please help me': '도와주세요',
          'How much is it?': '얼마예요?',
          'Where is the bathroom?': '화장실이 어디에 있어요?'
        },
        // 베트남어 -> 대만어
        'vi-zh-TW': {
          'Xin chào': '你好',
          'Cảm ơn': '謝謝',
          'Anh yêu em': '我愛你',
          'Ăn cơm chưa?': '吃飯了嗎？',
          'Đi đâu vậy?': '你要去哪裡？'
        },
        // 대만어 -> 베트남어
        'zh-TW-vi': {
          '你好': 'Xin chào',
          '謝謝': 'Cảm ơn',
          '我愛你': 'Anh yêu em',
          '吃飯了嗎？': 'Ăn cơm chưa?',
          '你要去哪裡？': 'Đi đâu vậy?'
        },
        // 베트남어 -> 영어
        'vi-en': {
          'Xin chào': 'Hello',
          'Cảm ơn': 'Thank you',
          'Anh yêu em': 'I love you',
          'Ăn cơm chưa?': 'Did you eat?',
          'Đi đâu vậy?': 'Where are you going?'
        },
        // 영어 -> 베트남어
        'en-vi': {
          'Hello': 'Xin chào',
          'Thank you': 'Cảm ơn',
          'I love you': 'Anh yêu em',
          'Did you eat?': 'Ăn cơm chưa?',
          'Where are you going?': 'Đi đâu vậy?'
        },
        // 대만어 -> 영어
        'zh-TW-en': {
          '你好': 'Hello',
          '謝謝': 'Thank you',
          '我愛你': 'I love you',
          '吃飯了嗎？': 'Did you eat?',
          '你要去哪裡？': 'Where are you going?'
        },
        // 영어 -> 대만어
        'en-zh-TW': {
          'Hello': '你好',
          'Thank you': '謝謝',
          'I love you': '我愛你',
          'Did you eat?': '吃飯了嗎？',
          'Where are you going?': '你要去哪裡？'
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
    const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/;
    const englishRegex = /^[a-zA-Z\s.,!?'"()-]+$/;
    
    if (koreanRegex.test(text)) {
      return 'ko';
    } else if (vietnameseRegex.test(text)) {
      return 'vi';
    } else if (chineseRegex.test(text)) {
      return 'zh-TW'; // 대만어 (번체 중국어)
    } else if (englishRegex.test(text.trim())) {
      return 'en';
    } else {
      return 'unknown';
    }
  }

  // 언어 이름 반환
  getLanguageName(langCode) {
    const languageNames = {
      'ko': '한국어',
      'vi': 'Tiếng Việt',
      'zh-TW': '繁體中文',
      'en': 'English'
    };
    return languageNames[langCode] || langCode;
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