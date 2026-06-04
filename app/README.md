# 🎵 MelodyNote

> 번뜩이는 생각과 흥얼거리는 멜로디를 바로 기록하고, 음악으로 발전시키는 앱

영감은 30초 안에 사라집니다. MelodyNote는 잠금화면에서 몇 번의 탭만으로 아이디어를 포착하고,
나중에 음악으로 발전시킬 수 있도록 도와줍니다.

## ✨ 기능

| 모드 | 설명 |
|------|------|
| 📝 **텍스트** | 가사, 코드 진행, 떠오르는 생각을 빠르게 메모 |
| 🎤 **보이스** | 실시간 파형을 보며 흥얼거리는 멜로디 녹음 (Web Audio API) |
| 🎹 **멜로디** | 16스텝 시퀀서 + 터치 피아노 + 탭 템포 BPM |

- **무드 / 장르 태그** — 나중에 비슷한 분위기의 아이디어를 모아보기
- **검색 & 필터** — 타입 · 무드 · BPM 범위로 빠르게 찾기
- **오프라인 우선** — 모든 데이터는 기기에 저장 (localStorage), 인터넷 없이 작동
- **PWA** — 홈 화면에 설치하면 진짜 앱처럼 실행

## 🚀 바로 실행하기 (로컬 테스트)

PWA 기능(서비스워커, 설치)은 `file://`이 아닌 **http(s) 서버**에서만 동작합니다.

```bash
cd app
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

마이크 녹음은 `localhost` 또는 HTTPS에서만 허용됩니다.

## 📱 홈 화면에 설치하기

- **Android (Chrome)**: 하단에 뜨는 "설치" 배너를 누르거나, 메뉴 → "홈 화면에 추가"
- **iOS (Safari)**: 공유 버튼 → "홈 화면에 추가"

설치하면 주소창 없는 전체화면 앱으로 실행되고, 오프라인에서도 열립니다.

## 🌐 무료 배포 (인터넷에 올리기)

정적 파일만 있으므로 아래 어디든 무료로 배포할 수 있습니다:

1. **GitHub Pages** — 이 레포 Settings → Pages → `/app` 폴더 지정 → 자동 HTTPS
2. **Netlify / Vercel** — `app` 폴더를 드래그&드롭 또는 레포 연결
3. **Cloudflare Pages** — 빌드 명령 없이 `app` 폴더 배포

배포 후 그 URL이 곧 설치 가능한 PWA가 됩니다.

## 📦 앱스토어 출시 경로 (선택)

PWA로 검증을 마친 뒤 실제 앱스토어에 올리려면:

1. [Capacitor](https://capacitorjs.com/) 설치 → 이 웹앱을 네이티브 껍데기로 감싸기
2. iOS: Xcode 빌드 + Apple Developer 등록($99/년) → App Store Connect 제출
3. Android: Android Studio 빌드 → Google Play Console($25 1회) 제출
   - 또는 [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)으로 PWA를 그대로 TWA 앱으로 패키징

코드 재사용률이 거의 100%라, 지금 만든 것을 그대로 활용할 수 있습니다.

## 🛠 기술 스택

- 순수 HTML / CSS / JavaScript (의존성 0개, 빌드 불필요)
- Web Audio API — 파형 시각화, 신디사이저, 시퀀서
- MediaRecorder API — 보이스 녹음
- localStorage — 오프라인 저장
- Service Worker + Web App Manifest — PWA / 오프라인 / 설치

## 📁 파일 구조

```
app/
├── index.html      # 화면 구조
├── style.css       # 다크 글래스모피즘 UI
├── app.js          # 모든 로직 (캡처/녹음/시퀀서/검색/PWA)
├── manifest.json   # PWA 매니페스트
├── sw.js           # 서비스워커 (오프라인 캐싱)
└── icons/          # 앱 아이콘 (생성 스크립트 포함)
```

## 🎨 아이콘 재생성

```bash
cd app/icons
python3 generate_icons.py
```
