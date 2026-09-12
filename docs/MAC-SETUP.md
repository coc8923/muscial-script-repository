# 맥에서 시작하기

> 이 문서는 **맥을 쓰는 공동작업자**를 위한 안내입니다.
> 컴퓨터를 잘 몰라도 따라 할 수 있게 썼습니다. 순서대로 하시면 됩니다.
> 전부 합쳐 **20~30분** 정도 걸립니다.

---

## 이게 무슨 작업인가요?

두 사람이 각자 다른 컴퓨터(맥 / 윈도우)에서 **같은 대본**을 작업하려고 합니다.
서로의 컴퓨터를 직접 연결하는 게 아니라, **GitHub라는 인터넷 창고**를 가운데 두고
각자 물건을 넣고 꺼내는 방식입니다.

```
   [맥]                                      [윈도우]
    │                                            │
    │  ①올리기(Push)      ┌─────────────┐        │
    ├───────────────────→ │   GitHub     │ ←──────┤
    │                     │ (공동 창고)   │        │
    └───────────────────  └─────────────┘  ──────→│
       ②받기(Pull)                          
```

**핵심**: 내 컴퓨터에는 항상 "내 복사본"이 있고, 진짜 원본은 GitHub에 있습니다.

---

## 준비물 (먼저 확인하세요)

| 필요한 것 | 확인 방법 | 없다면 |
|---|---|---|
| GitHub 계정 | github.com 로그인 되나요? | github.com 에서 무료 가입 |
| 저장소 초대 수락 | 메일함에 GitHub 초대장 | Joseph에게 초대 요청 |
| Claude 구독 | claude.ai 로그인 후 Pro/Max 확인 | claude.com/pricing |

> ⚠️ **Claude 계정은 각자 자기 것을 쓰세요.** 한 계정을 둘이 나눠 쓰면 사용량
> 한도를 같이 깎아먹어서 둘 다 금방 막힙니다. 계정은 개인 사용이 전제입니다.
> (출처: [Claude Code Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance))

---

## 1단계 — GitHub 초대 수락하기

1. 메일함에서 GitHub가 보낸 초대 메일을 엽니다
2. **Accept invitation**(초대 수락) 버튼을 누릅니다
3. `coc8923/muscial-script-repository` 페이지가 열리면 성공입니다

---

## 2단계 — GitHub Desktop 설치하기

터미널에 명령어를 치는 대신, **버튼을 누르는 프로그램**을 씁니다.

1. [desktop.github.com/download](https://desktop.github.com/download/) 접속
2. 맥 버전을 내려받습니다
   - 최근 맥(M1/M2/M3/M4)이면 **Apple Silicon**
   - 오래된 맥이면 **Intel**
   - 모르겠으면: 화면 왼쪽 위 🍎 → "이 Mac에 관하여" → 칩 이름 확인
3. 내려받은 파일을 열고, GitHub Desktop 아이콘을 **응용 프로그램** 폴더로 끌어다 놓습니다
4. GitHub Desktop을 실행하고 **Sign in to GitHub.com**으로 로그인합니다

> 💡 GitHub Desktop은 무료이고, **Git도 같이 설치해줍니다.**
> 따로 Git을 설치할 필요가 없습니다.
> (출처: [GitHub Desktop documentation](https://docs.github.com/en/desktop))

---

## 3단계 — 대본 저장소 내려받기 (Clone)

1. GitHub Desktop 상단 메뉴 → **File** → **Clone Repository**
2. **GitHub.com** 탭에서 `muscial-script-repository`를 찾아 선택
3. **Local Path**(저장 위치)를 확인합니다 — 기본값 그대로 두셔도 됩니다
4. **Clone** 버튼 클릭

이제 맥 안에 대본 폴더가 생겼습니다. 위치를 꼭 기억해두세요.
보통 `/Users/(내이름)/Documents/GitHub/muscial-script-repository` 입니다.

---

## 4단계 — Claude Code 설치하기

1. Spotlight 검색(`⌘ + 스페이스바`)에서 **터미널**을 찾아 엽니다
   - 검은 창이 뜨는데, 겁내지 않으셔도 됩니다. 글자로 명령하는 창일 뿐입니다.
2. 아래를 **복사해서 붙여넣고 엔터**를 칩니다

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

3. 설치가 끝나면 **터미널을 완전히 껐다가 다시 켭니다** (중요!)
4. 제대로 설치됐는지 확인합니다

```bash
claude --version
```

숫자와 함께 `(Claude Code)`가 나오면 성공입니다.

> 출처: [Claude Code Quickstart](https://code.claude.com/docs/en/quickstart)

---

## 5단계 — Claude Code 실행하고 로그인하기

터미널에서 대본 폴더로 이동한 뒤 Claude를 켭니다.

```bash
cd ~/Documents/GitHub/muscial-script-repository
claude
```

> 💡 **폴더 경로를 모르겠다면?**
> 터미널에 `cd ` 를 치고 (뒤에 **한 칸 띄우고**),
> Finder에서 대본 폴더를 터미널 창으로 **끌어다 놓으면** 경로가 자동으로 들어갑니다.
> 그다음 엔터.

처음 실행하면 로그인 화면이 뜹니다. 브라우저가 열리면 **본인의 claude.ai 계정**으로
로그인하세요. 한 번만 하면 됩니다.

로그인이 끝나면 이렇게 인사해보세요:

```
이 프로젝트가 뭐 하는 건지 설명해줘
```

---

## 6단계 — 매일의 작업 순서 (제일 중요)

이 세 단계만 지키면 사고가 나지 않습니다.

### ① 작업 시작 전 — 받기 (Pull)

**GitHub Desktop**을 열고 상단의 **Fetch origin** 버튼을 누릅니다.
**Pull origin**으로 바뀌면 한 번 더 누릅니다.

> 상대방이 바꾼 내용을 먼저 받아오는 단계입니다.
> **이걸 건너뛰면 충돌이 납니다.** 반드시 먼저 하세요.

### ② 작업하기

터미널에서 `claude`를 켜고 대본을 씁니다. Claude가 파일을 고쳐줍니다.

### ③ 작업 끝나면 — 올리기 (Push)

**GitHub Desktop**으로 돌아옵니다.

1. 왼쪽에 바뀐 파일 목록이 보입니다
2. 왼쪽 아래 칸에 **뭘 했는지 한 줄**로 적습니다 (예: `3장 앙투안 대사 다듬음`)
3. **Commit to main** 버튼 클릭
4. 상단 **Push origin** 버튼 클릭

이제 상대방이 받아볼 수 있습니다. 🎉

---

## 자주 막히는 곳

### "claude: command not found" 가 뜹니다
→ 터미널을 **완전히 종료했다가** 다시 켜보세요 (`⌘ + Q`). 대부분 이걸로 해결됩니다.

### GitHub Desktop에 저장소가 안 보입니다
→ 초대를 아직 수락하지 않았을 수 있습니다. 메일함을 확인하세요.
→ 수락했다면 GitHub Desktop에서 로그아웃 후 다시 로그인해보세요.

### Push 버튼이 회색이라 눌리지 않습니다
→ Commit을 먼저 해야 합니다. (③번의 2~3단계)

### "conflict"(충돌) 라는 빨간 글자가 떴습니다
→ **혼자 해결하려 하지 마세요.** 상대방과 통화하면서 같이 처리하세요.
→ 자세한 내용은 [공동작업 규칙](WORKFLOW.md)을 보세요.

### 뭔가 잘못 만진 것 같습니다
→ 아직 Push를 안 했다면 **아무 일도 일어나지 않은 것**입니다. GitHub에는 영향이 없습니다.
→ Claude에게 물어보세요: `내가 뭘 바꿨는지 알려줘`

---

## 한 장 요약

```
작업 시작  →  GitHub Desktop에서 [Fetch/Pull] 누르기
작업 중    →  터미널에서 claude 실행, 대본 쓰기
작업 끝    →  GitHub Desktop에서 [Commit] → [Push]
```

**"시작 전 Pull, 끝나면 Push"** — 이 여섯 글자만 기억하세요.
