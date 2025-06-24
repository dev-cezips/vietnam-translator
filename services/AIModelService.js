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
      
      // 더미 음성 인식 결과 (4개 언어) - 사용자가 자주 말할 법한 순서로 정렬
      const commonPhrases = [
        // 자주 사용하는 한국어 표현
        '사랑해',
        '사랑해요',
        '안녕하세요',
        '고마워요',
        '네',
        '아니요',
        '죄송합니다',
        '도와주세요',
        '물',
        '음식',
        // 일상 대화
        '밥 먹었어요?',
        '어디 가세요?',
        '좋은 아침입니다',
        '잘 자요',
        '얼마예요?',
        '화장실이 어디에 있어요?',
        // 베트남어
        'Anh yêu em',
        'Xin chào',
        'Cảm ơn',
        'Vâng',
        'Không',
        'Xin lỗi',
        'Nước',
        'Đồ ăn',
        // 대만어
        '我愛你',
        '你好',
        '謝謝',
        '是的',
        '不是',
        '對不起',
        '水',
        '食物',
        // 영어
        'I love you',
        'Hello',
        'Thank you',
        'Yes',
        'No',
        'I am sorry',
        'Water',
        'Food'
      ];

      // 첫 번째 시도에서는 자주 사용하는 표현 중에서 선택 (가중치 적용)
      let result;
      const randomNum = Math.random();
      
      if (randomNum < 0.7) {
        // 70% 확률로 자주 사용하는 한국어 표현
        const koreanCommon = commonPhrases.slice(0, 16);
        result = koreanCommon[Math.floor(Math.random() * koreanCommon.length)];
      } else {
        // 30% 확률로 전체 표현 중에서
        result = commonPhrases[Math.floor(Math.random() * commonPhrases.length)];
      }
      
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
          '사랑해': 'Anh yêu em',
          '사랑': 'Tình yêu',
          '좋은 아침입니다': 'Chào buổi sáng',
          '잘 자요': 'Chúc ngủ ngon',
          '도와주세요': 'Xin hãy giúp tôi',
          '얼마예요?': 'Bao nhiêu tiền?',
          '화장실이 어디에 있어요?': 'Toilet ở đâu?',
          '네': 'Vâng',
          '아니요': 'Không',
          '죄송합니다': 'Xin lỗi',
          '물': 'Nước',
          '음식': 'Đồ ăn'
        },
        // 베트남어 -> 한국어
        'vi-ko': {
          'Xin chào': '안녕하세요',
          'Xin chào, hôm nay thời tiết đẹp.': '안녕하세요, 오늘 날씨가 좋네요.',
          'Ăn cơm chưa?': '밥 먹었어요?',
          'Đi đâu vậy?': '어디 가세요?',
          'Cảm ơn': '고마워요',
          'Anh yêu em': '사랑해요',
          'Tình yêu': '사랑',
          'Chào buổi sáng': '좋은 아침입니다',
          'Chúc ngủ ngon': '잘 자요',
          'Xin hãy giúp tôi': '도와주세요',
          'Bao nhiêu tiền?': '얼마예요?',
          'Toilet ở đâu?': '화장실이 어디에 있어요?',
          'Vâng': '네',
          'Không': '아니요',
          'Xin lỗi': '죄송합니다',
          'Nước': '물',
          'Đồ ăn': '음식'
        },
        // 한국어 -> 대만어
        'ko-zh-TW': {
          '안녕하세요': '你好',
          '안녕하세요, 오늘 날씨가 좋네요.': '你好，今天天氣真好。',
          '밥 먹었어요?': '吃飯了嗎？',
          '어디 가세요?': '你要去哪裡？',
          '고마워요': '謝謝',
          '사랑해요': '我愛你',
          '사랑해': '我愛你',
          '사랑': '愛',
          '좋은 아침입니다': '早安',
          '잘 자요': '晚安',
          '도와주세요': '請幫助我',
          '얼마예요?': '多少錢？',
          '화장실이 어디에 있어요?': '廁所在哪裡？',
          '네': '是的',
          '아니요': '不是',
          '죄송합니다': '對不起',
          '물': '水',
          '음식': '食物'
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
          '사랑해': 'I love you',
          '사랑': 'Love',
          '좋은 아침입니다': 'Good morning',
          '잘 자요': 'Good night',
          '도와주세요': 'Please help me',
          '얼마예요?': 'How much is it?',
          '화장실이 어디에 있어요?': 'Where is the bathroom?',
          '네': 'Yes',
          '아니요': 'No',
          '죄송합니다': 'I am sorry',
          '물': 'Water',
          '음식': 'Food'
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
      console.log(`번역 시도: "${text}" (${fromLang} -> ${toLang})`);
      console.log(`언어 쌍: ${langPair}`);
      
      let result = translations[langPair]?.[text];
      console.log(`직접 매칭 결과: ${result}`);
      
      if (!result) {
        // 부분 매칭 시도 (공백과 구두점 제거)
        const cleanText = text.trim().toLowerCase();
        const cleanTranslations = {};
        
        if (translations[langPair]) {
          Object.keys(translations[langPair]).forEach(key => {
            cleanTranslations[key.trim().toLowerCase()] = translations[langPair][key];
          });
        }
        
        result = cleanTranslations[cleanText];
        console.log(`정리된 텍스트로 재시도: "${cleanText}" -> ${result}`);
      }
      
      if (!result) {
        // 간단한 단어 번역 시도
        result = `[AI 번역] ${text}`;
        console.log(`기본 번역으로 대체: ${result}`);
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