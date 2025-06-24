import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Dimensions,
  TextInput,
  Modal
} from 'react-native';
// WebRTC는 Expo Go에서 지원되지 않으므로 조건부 import
let RTCView, RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices;

try {
  const webRTC = require('react-native-webrtc');
  RTCView = webRTC.RTCView;
  RTCPeerConnection = webRTC.RTCPeerConnection;
  RTCIceCandidate = webRTC.RTCIceCandidate;
  RTCSessionDescription = webRTC.RTCSessionDescription;
  mediaDevices = webRTC.mediaDevices;
} catch (error) {
  console.log('WebRTC not available in Expo Go');
}
import AIModelService from '../services/AIModelService';

const { width, height } = Dimensions.get('window');

export default function VideoCall({ onTranscription }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [subtitles, setSubtitles] = useState('');
  const [roomId, setRoomId] = useState('');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [webRTCAvailable, setWebRTCAvailable] = useState(false);
  
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    // WebRTC 사용 가능 여부 확인
    setWebRTCAvailable(!!mediaDevices);
  }, []);

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  const initializePeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };

    peerConnection.current = new RTCPeerConnection(configuration);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        // 실제 구현에서는 시그널링 서버를 통해 상대방에게 전송
        console.log('ICE candidate:', event.candidate);
      }
    };

    peerConnection.current.onaddstream = (event) => {
      setRemoteStream(event.stream);
    };

    peerConnection.current.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.current.connectionState);
    };
  };

  const startCall = async () => {
    try {
      setIsConnecting(true);
      
      // 카메라와 마이크 권한 요청
      const stream = await mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      setLocalStream(stream);
      localStreamRef.current = stream;

      initializePeerConnection();
      peerConnection.current.addStream(stream);

      setIsCallActive(true);
      setIsConnecting(false);

      // 실시간 음성 인식 시작 (시뮬레이션)
      startRealTimeTranscription();

    } catch (error) {
      console.error('통화 시작 실패:', error);
      Alert.alert('오류', '카메라 또는 마이크에 접근할 수 없습니다.');
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setSubtitles('');
  };

  const startRealTimeTranscription = () => {
    // 실제 환경에서는 연속적인 음성 인식 구현
    // 현재는 데모용 시뮬레이션
    const demoSubtitles = [
      '안녕하세요, 만나서 반갑습니다.',
      'Xin chào, rất vui được gặp bạn.',
      '오늘 날씨가 정말 좋네요.',
      'Hôm nay thời tiết thật đẹp.',
      '베트남 음식을 좋아해요.',
      'Tôi thích đồ ăn Việt Nam.'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < demoSubtitles.length && isCallActive) {
        setSubtitles(demoSubtitles[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const joinRoom = (id) => {
    setRoomId(id);
    setShowRoomModal(false);
    startCall();
  };

  // WebRTC가 없을 때 안내 화면
  if (!webRTCAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.title}>🎥 동영상 통화</Text>
          <Text style={styles.subtitle}>실시간 번역 기능이 포함된 동영상 통화</Text>
          
          <View style={styles.notAvailableContainer}>
            <Text style={styles.notAvailableTitle}>📱 Expo Go 제한사항</Text>
            <Text style={styles.notAvailableText}>
              동영상 통화 기능은 Expo Go에서 지원되지 않습니다.
            </Text>
            <Text style={styles.notAvailableText}>
              실제 앱 빌드 시에는 정상 작동합니다.
            </Text>
            
            <View style={styles.alternativeContainer}>
              <Text style={styles.alternativeTitle}>대신 사용 가능한 기능:</Text>
              <Text style={styles.alternativeText}>📝 텍스트 번역</Text>
              <Text style={styles.alternativeText}>🎤 음성 인식 번역</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!isCallActive) {
    return (
      <View style={styles.container}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.title}>🎥 동영상 통화</Text>
          <Text style={styles.subtitle}>실시간 번역 기능이 포함된 동영상 통화</Text>
          
          <View style={styles.featuresContainer}>
            <Text style={styles.featureText}>✨ 실시간 음성 인식</Text>
            <Text style={styles.featureText}>🔄 자동 번역 자막</Text>
            <Text style={styles.featureText}>🎙️ 양방향 음성 번역</Text>
          </View>

          <TouchableOpacity 
            style={styles.startCallButton}
            onPress={() => setShowRoomModal(true)}
            disabled={isConnecting}
          >
            <Text style={styles.startCallButtonText}>
              {isConnecting ? '연결 중...' : '📞 통화 시작'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testCallButton}
            onPress={startCall}
            disabled={isConnecting}
          >
            <Text style={styles.testCallButtonText}>
              🧪 테스트 통화 (데모)
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showRoomModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>통화방 입장</Text>
              <TextInput
                style={styles.roomInput}
                placeholder="통화방 ID를 입력하세요"
                value={roomId}
                onChangeText={setRoomId}
                autoCapitalize="none"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowRoomModal(false)}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => joinRoom(roomId)}
                  disabled={!roomId.trim()}
                >
                  <Text style={styles.joinButtonText}>입장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.callContainer}>
      {/* 원격 비디오 (전체 화면) */}
      {remoteStream ? (
        <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} />
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>상대방 연결 대기 중...</Text>
        </View>
      )}

      {/* 로컬 비디오 (작은 화면) */}
      {localStream && (
        <RTCView 
          streamURL={localStream.toURL()} 
          style={styles.localVideo}
          mirror={true}
        />
      )}

      {/* 실시간 자막 */}
      {subtitles && (
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitleText}>{subtitles}</Text>
        </View>
      )}

      {/* 통화 제어 버튼 */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.muteButton}>
          <Text style={styles.controlButtonText}>🔇</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.endCallButton}
          onPress={endCall}
        >
          <Text style={styles.controlButtonText}>📞</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cameraButton}>
          <Text style={styles.controlButtonText}>📹</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  featuresContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  featureText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  startCallButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  startCallButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testCallButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  testCallButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  callContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#333',
  },
  localVideo: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  waitingText: {
    color: 'white',
    fontSize: 18,
  },
  subtitleContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  subtitleText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 50,
  },
  muteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  roomInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#6C757D',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  notAvailableContainer: {
    backgroundColor: '#FFF3CD',
    padding: 20,
    borderRadius: 10,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  notAvailableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
    textAlign: 'center',
  },
  notAvailableText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  alternativeContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#D4EDDA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C3E6CB',
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 10,
    textAlign: 'center',
  },
  alternativeText: {
    fontSize: 14,
    color: '#155724',
    textAlign: 'center',
    marginBottom: 5,
  },
});