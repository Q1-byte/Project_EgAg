import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage, Layer, Line, Rect } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { identifyCanvas, consumeToken } from '../api/canvas'
import { useAuthStore } from '../stores/useAuthStore'
import { Ticket } from 'lucide-react'

const COLORS = [
  '#1a1a2e', '#e63946', '#f4a261', '#f9c74f',
  '#43aa8b', '#4361ee', '#9b5de5', '#f72585', '#ffffff',
]
const WIDTHS = [3, 6, 12, 20]
const TIME_PER_ROUND = 30
const TOTAL_ROUNDS = 4
const CHECK_INTERVAL_MS = 2000
const STROKE_DEBOUNCE_MS = 700

const SUBJECTS = [
  // 동물
  '고양이', '강아지', '토끼', '곰', '사자', '코끼리', '기린', '원숭이',
  '돌고래', '물고기', '새', '나비', '거미', '공룡', '펭귄', '여우',
  '개구리', '뱀', '거북이', '햄스터', '소', '돼지', '닭', '오리',
  '호랑이', '늑대', '말', '양', '독수리', '문어', '게', '새우',
  '악어', '코알라', '캥거루', '치타', '하마', '고릴라', '앵무새', '두더지',
  // 음식
  '사과', '바나나', '딸기', '수박', '케이크', '피자', '아이스크림',
  '햄버거', '라면', '초밥', '당근', '브로콜리', '포도', '복숭아', '옥수수',
  '레몬', '파인애플', '체리', '도넛', '타코', '쿠키', '파스타', '샌드위치',
  '계란', '고구마', '감자', '빵', '치킨', '떡볶이', '김밥', '커피',
  // 탈것
  '자전거', '자동차', '비행기', '로켓', '배', '기차', '버스', '헬리콥터',
  '오토바이', '잠수함', '트럭', '스쿠터', '열기구', '소방차', '택시', '킥보드',
  // 자연·날씨
  '무지개', '해', '달', '별', '구름', '번개', '나무', '꽃', '버섯', '산', '파도',
  '선인장', '야자수', '불꽃', '눈결정', '화산', '섬', '강', '폭포', '토네이도',
  // 사물·생활
  '집', '우산', '안경', '모자', '연필', '가위', '전화기', '시계', '책',
  '기타', '피아노', '축구공', '눈사람', '하트', '왕관', '칫솔', '컵',
  '열쇠', '가방', '신발', '양말', '텐트', '사다리', '망원경', '나침반',
  '카메라', '피리', '드럼', '풍선', '연', '낚싯대', '빗자루', '돋보기',
  '지구본', '트로피', '로봇', '마법봉', '방패', '닻',
]

function pickSubjects(n: number) {
  return [...SUBJECTS].sort(() => Math.random() - 0.5).slice(0, n)
}

const DRAWING_TIPS: Record<string, string[]> = {
  // 동물
  '고양이': ['뾰족한 삼각형 귀 두 개가 핵심이에요', '좌우로 뻗은 긴 수염을 꼭 그려주세요', '세모 코와 동그란 눈으로 얼굴을 완성하세요'],
  '강아지': ['귀를 크게 아래로 늘어뜨려 그려보세요', '코를 크고 둥글게, 혀를 내밀면 바로 알아봐요', '몸통에 비해 큰 머리를 그리면 귀엽게 보여요'],
  '토끼': ['아주 긴 귀 두 개가 가장 중요해요', '동그란 꼬리도 옆에 살짝 그려주세요', '앞발을 가슴 앞에 모아 그리면 완벽해요'],
  '곰': ['통통하고 둥근 몸체와 짧은 다리가 특징이에요', '귀를 반원형으로 머리 위에 그려주세요', '코 주변에 밝은 원형 영역을 표현하면 더 좋아요'],
  '사자': ['갈기를 머리 주변에 크게 둥글게 그리세요', '사각진 큰 코와 수염을 강조하세요', '꼬리 끝에 털 뭉치를 그려주면 완성돼요'],
  '코끼리': ['긴 코(코끼리 코)를 S자로 늘어뜨리는 게 핵심이에요', '큰 부채 모양 귀를 양쪽에 그려주세요', '굵고 짧은 다리 네 개와 작은 꼬리를 추가하세요'],
  '기린': ['목을 매우 길게 세로로 뻗어 그리세요', '몸통에 불규칙한 갈색 패턴을 그려주세요', '머리 위 작은 뿔(ossicones)을 잊지 마세요'],
  '원숭이': ['동그란 얼굴에 긴 팔을 과장되게 그리세요', '밝은 색의 둥근 얼굴 중앙(주둥이)을 표현하세요', '긴 꼬리를 S자 모양으로 그려주세요'],
  '돌고래': ['유선형 몸체에 등 지느러미를 위로 뾰족하게 그리세요', '웃는 입(부리)을 길고 앞으로 내밀어 그려주세요', '꼬리를 수평으로 넓게 펼쳐 그리세요'],
  '물고기': ['유선형 몸체와 부채꼴 꼬리지느러미가 핵심이에요', '옆면에 비늘 패턴을 그리면 바로 알아봐요', '눈을 크고 동그랗게 그려주세요'],
  '새': ['날개를 V자나 M자로 크게 펼쳐 그리세요', '뾰족한 부리와 작은 발을 그려주세요', '눈을 작고 동그랗게 그리면 완성돼요'],
  '나비': ['대칭되는 큰 날개 두 쌍을 그리세요', '날개 안에 원형 무늬나 패턴을 넣어주세요', '더듬이 두 개를 머리 위에 뻗어 그리세요'],
  '거미': ['몸통(두 개의 타원)과 다리 8개가 핵심이에요', '다리를 구부러진 형태로 양쪽에 4개씩 그리세요', '거미줄 위에 앉아있으면 바로 알아봐요'],
  '공룡': ['뒷다리를 크게, 앞발을 작게 그려 자세를 표현하세요', '등 위에 뾰족한 가시를 여러 개 그려주세요', '긴 꼬리를 뒤로 뻗어 균형을 잡아주세요'],
  '펭귄': ['흰 배와 검은 등을 명확히 구분해 그리세요', '짧고 뚱뚱한 몸체에 짧은 날개(팔)를 표현하세요', '주황색 부리와 발을 강조해주세요'],
  '여우': ['뾰족한 귀와 긴 주둥이가 특징이에요', '풍성하고 큰 꼬리를 그려주세요', '눈 주변을 어둡게 표현하면 더 여우답게 보여요'],
  '개구리': ['납작하고 넓은 몸체에 큰 뒷다리를 그리세요', '크고 튀어나온 눈 두 개를 머리 위에 그려주세요', '앞다리를 앞으로 뻗은 자세가 특징적이에요'],
  '뱀': ['S자나 나선형으로 몸을 구불구불하게 그리세요', '납작하고 삼각형인 머리를 앞에 그리세요', '혀를 두 갈래로 내밀면 바로 알아봐요'],
  '거북이': ['등껍질을 육각형 패턴으로 돔 모양으로 그리세요', '껍질 아래로 머리와 다리가 삐죽 나오게 그려주세요', '짧고 굵은 다리 4개를 표현하세요'],
  '햄스터': ['볼이 빵빵하게 부풀어 있는 동그란 얼굴이 핵심이에요', '짧고 통통한 몸체와 작은 귀를 그려주세요', '짧은 꼬리와 작은 손을 앞에 그리세요'],
  '소': ['큼직한 네모진 몸체와 굵은 네 다리를 그리세요', '머리에 뿔을 U자로 그려주세요', '얼룩무늬(검은 점)를 몸통에 그리면 완벽해요'],
  '돼지': ['동그랗고 통통한 분홍 몸체를 그리세요', '코를 동그랗게 크게 강조하고 콧구멍 두 개를 그리세요', '꼬리를 나선형으로 그려주면 바로 알아봐요'],
  '닭': ['붉은 볏을 머리 위에 크게 그리세요', '꼬리깃을 부채꼴로 화려하게 표현해주세요', '뾰족한 부리와 턱 아래 붉은 육수를 그려주세요'],
  '오리': ['납작하고 넓적한 오렌지색 부리가 핵심이에요', '통통한 몸체에 꼬리를 위로 살짝 올려 그리세요', '물 위에 떠있는 형태로 그리면 바로 알아봐요'],
  '호랑이': ['주황 바탕에 검은 세로 줄무늬를 그리세요', '큰 머리에 흰 뺨 부분을 표현해주세요', '수염과 날카로운 눈을 강조하세요'],
  '늑대': ['뾰족한 귀와 긴 주둥이를 강조하세요', '달을 향해 하울링하는 자세가 인상적이에요', '복슬복슬한 꼬리를 크게 그려주세요'],
  '말': ['가늘고 긴 다리 네 개가 핵심이에요', '목에서 머리까지 이어지는 갈기를 그려주세요', '납작한 얼굴과 긴 코를 표현하세요'],
  '양': ['온몸을 구름처럼 곱슬곱슬한 털로 덮어 그리세요', '검은 얼굴과 다리를 털 사이로 보이게 하세요', '짧은 꼬리를 뒤에 그려주면 완성돼요'],
  '독수리': ['날개를 넓게 펼쳐 W자 모양으로 크게 그리세요', '날카롭고 굽은 부리를 강조하세요', '발톱을 크고 날카롭게 표현해주세요'],
  '문어': ['둥근 머리(외투막)에 다리 8개를 구불구불 그리세요', '다리에 동그란 빨판을 줄줄이 그려주세요', '눈을 크게 표현하면 바로 알아봐요'],
  '게': ['옆으로 넓은 몸체에 집게발을 크게 그리세요', '다리를 양쪽에 4개씩 구부려 그리세요', '눈을 위쪽으로 튀어나오게 그려주세요'],
  '새우': ['C자로 구부러진 몸체와 긴 더듬이가 핵심이에요', '꼬리를 부채 모양으로 펼쳐 그리세요', '여러 마디로 나뉜 몸통을 표현해주세요'],
  '악어': ['긴 몸체와 뾰족한 이빨이 삐죽 보이는 입이 핵심이에요', '등에 울퉁불퉁한 비늘 돌기를 그려주세요', '꼬리를 길고 굵게 그려주세요'],
  '코알라': ['크고 복슬복슬한 회색 귀가 핵심이에요', '큰 검은 코와 동그란 얼굴을 강조하세요', '나뭇가지를 꽉 껴안은 자세로 그리면 완벽해요'],
  '캥거루': ['강한 뒷다리와 두꺼운 꼬리를 크게 그리세요', '앞발을 작게, 배에 주머니(육아낭)를 그려주세요', '긴 귀와 작은 앞발이 특징이에요'],
  '치타': ['날씬한 몸체와 긴 다리를 표현하세요', '눈 아래 검은 줄무늬(눈물 자국)를 그려주세요', '온몸에 작은 검은 점을 뿌려주세요'],
  '하마': ['매우 크고 둥근 몸체에 짧은 다리를 그리세요', '큰 입을 크게 벌린 모습이 특징적이에요', '콧구멍과 눈이 위쪽에 몰려있게 그리세요'],
  '고릴라': ['가슴을 넓고 크게, 팔을 굵게 표현하세요', '팔을 짚고 앞으로 기울어진 자세가 특징이에요', '납작하고 넓은 검은 코를 강조하세요'],
  '앵무새': ['알록달록한 색깔로 날개를 칠해주세요', '굽은 부리를 크게 강조하세요', '발로 나뭇가지를 잡고 있는 자세가 특징이에요'],
  '두더지': ['짧은 앞발을 삽처럼 크고 넓게 그리세요', '눈을 아주 작게, 코를 뾰족하게 그려주세요', '땅을 파고 나오는 자세로 그리면 바로 알아봐요'],
  // 음식
  '사과': ['빨간 원형에 꼭지와 잎 하나를 그리세요', '위쪽에 살짝 들어간 홈을 표현해주세요', '윗면에 하이라이트를 그리면 입체감이 살아나요'],
  '바나나': ['노란 초승달 모양을 크게 그리세요', '양 끝을 뾰족하게, 중간을 볼록하게 표현하세요', '꼭지를 한쪽 끝에 짧게 그려주세요'],
  '딸기': ['하트 모양 빨간 몸체에 씨앗을 점점이 그리세요', '위쪽에 초록색 잎을 방사형으로 그려주세요', '씨앗을 노란 점으로 표면에 뿌려주세요'],
  '수박': ['초록 줄무늬가 있는 큰 타원이 핵심이에요', '잘라낸 단면에 빨간 속살과 검은 씨앗을 그리세요', '초록 세로 줄무늬를 규칙적으로 그려주세요'],
  '케이크': ['층층이 쌓인 원형 케이크에 초를 꽂아주세요', '위에 크림을 물결 모양으로 장식하세요', '측면에 층 구분선을 그리면 더 케이크답게 보여요'],
  '피자': ['삼각형 조각이나 원형으로 그리세요', '위에 동그란 토핑(페퍼로니 등)을 올려주세요', '테두리 크러스트를 두껍게 그려주세요'],
  '아이스크림': ['원뿔형 콘 위에 동그란 스쿱을 올리세요', '스쿱 위에 흘러내리는 느낌을 표현해주세요', '콘에 격자무늬를 그리면 완성돼요'],
  '햄버거': ['둥근 번 - 패티 - 번 순서로 층층이 그리세요', '사이에 양상추, 토마토, 치즈를 색으로 표현하세요', '옆에서 본 단면 형태로 그리면 바로 알아봐요'],
  '라면': ['그릇 안에 구불구불한 면을 가득 그리세요', '위에 달걀 반쪽과 파를 올려주세요', '국물을 빨간 색으로 표현하면 더 좋아요'],
  '초밥': ['흰 밥뭉치 위에 주황 생선을 올리세요', '밥뭉치를 타원형으로 그리고 생선을 위에 덮어주세요', '옆에 초록 와사비를 작게 그리면 완성돼요'],
  '당근': ['주황 삼각형(뿌리) 위에 초록 잎을 폭발적으로 그리세요', '뿌리에 가로 줄을 몇 개 그으면 사실적으로 보여요', '잎을 여러 갈래로 나눠 표현해주세요'],
  '브로콜리': ['초록 구름 모양 봉오리를 위에 크게 그리세요', '아래 굵은 줄기를 짧게 그려주세요', '봉오리에 작은 덩어리감을 표현하면 바로 알아봐요'],
  '포도': ['작은 원들을 삼각형 형태로 무리지어 그리세요', '위에 줄기와 잎을 연결해주세요', '포도알을 보라색으로 겹쳐 그리면 풍성해 보여요'],
  '복숭아': ['복숭아색 동그라미 위에 세로 선을 그어주세요', '꼭지와 작은 잎을 위에 그려주세요', '한쪽을 살짝 불룩하게 그리면 더 복숭아답게 보여요'],
  '옥수수': ['세로로 긴 타원에 격자 패턴을 그리세요', '위아래에 초록 껍질을 덮어주세요', '옥수수 수염을 위쪽에 실처럼 그려주세요'],
  '레몬': ['노란 타원형 양 끝을 뾰족하게 그리세요', '단면을 그리면 방사형 속살 패턴을 그려주세요', '표면에 울퉁불퉁한 질감을 점으로 표현하세요'],
  '파인애플': ['타원형 몸통에 격자 패턴을 그리세요', '위에 뾰족한 잎을 여러 개 그려주세요', '격자에 작은 점을 찍으면 더 파인애플답게 보여요'],
  '체리': ['작은 원 두 개를 나란히 그리세요', '각각에서 줄기가 올라와 하나로 합쳐지게 그리세요', '빨간색으로 채우고 하이라이트를 작은 흰 점으로 표현하세요'],
  '도넛': ['링 모양(원 안에 원)을 그리세요', '위에 핑크 글레이즈를 흘리듯 칠하세요', '스프링클(작은 색선들)을 뿌려주면 완성돼요'],
  '타코': ['U자 모양 토르티야 반으로 그리세요', '안에 채소, 고기, 치즈를 층층이 표현하세요', '위에 삐죽 나오는 재료들을 다채롭게 그려주세요'],
  '쿠키': ['울퉁불퉁한 원형에 초콜릿칩을 점점이 그리세요', '가장자리를 약간 불규칙하게 그리면 더 자연스러워요', '표면을 약간 갈색으로 칠해주세요'],
  '파스타': ['접시 위에 구불구불한 면을 쌓아 그리세요', '위에 빨간 소스를 뿌린 느낌을 표현하세요', '포크가 면을 감은 모습을 옆에 그리면 바로 알아봐요'],
  '샌드위치': ['두 식빵 사이에 채소와 재료를 층층이 그리세요', '삼각형으로 자른 단면 형태가 가장 알아보기 쉬워요', '각 층을 다른 색으로 구분해주세요'],
  '계란': ['타원형 하얀 흰자 안에 노란 노른자를 동그랗게 그리세요', '후라이 형태는 가장자리를 불규칙하게 표현하세요', '반숙이면 노른자를 볼록하게 그려주세요'],
  '고구마': ['통통한 주황색 방추형(럭비공 모양)으로 그리세요', '표면에 세로 주름선 몇 개를 그려주세요', '끝에 가는 뿌리 수염을 그리면 더 고구마답게 보여요'],
  '감자': ['울퉁불퉁한 갈색 타원으로 그리세요', '표면에 점(눈)을 여기저기 찍어주세요', '불규칙한 형태가 핵심이에요 - 너무 둥글게 그리지 마세요'],
  '빵': ['반원 모양 빵에 결 선을 위에 그으세요', '식빵은 네모, 바게트는 긴 타원으로 표현하세요', '위에 칼집 선 두세 개를 그으면 바로 알아봐요'],
  '치킨': ['다리 뼈가 달린 닭다리 모양이 가장 인식률이 높아요', '울퉁불퉁한 튀김옷을 외곽선으로 표현하세요', '뼈를 하얗게 선명히 그려주세요'],
  '떡볶이': ['길쭉한 원통형 떡을 여러 개 그리세요', '빨간 소스에 담긴 모습으로 표현하세요', '어묵을 사각형으로 곁들이면 더 완벽해요'],
  '김밥': ['원형 단면을 그리고 안에 재료를 동심원으로 표현하세요', '가장 바깥은 검은 김, 다음은 흰 밥으로 그리세요', '중앙에 노란 단무지, 빨간 당근을 그리면 완성이에요'],
  '커피': ['원형 컵에 갈색 음료를 담아 그리세요', '위에 크림이나 거품을 그려주세요', '받침 접시와 손잡이를 그리면 바로 알아봐요'],
  // 탈것
  '자전거': ['두 개의 큰 원(바퀴)을 나란히 그리세요', '바퀴를 연결하는 프레임과 안장, 핸들을 그려주세요', '바퀴 중심에서 방사형으로 살을 그리면 완성돼요'],
  '자동차': ['옆면을 보이게 그리고 바퀴 두 개를 아래 그리세요', '창문을 사다리꼴로 차체 위에 그려주세요', '헤드라이트와 범퍼를 앞에 표현하세요'],
  '비행기': ['긴 원통형 몸체에 삼각형 날개를 양쪽에 그리세요', '꼬리에 수직, 수평 날개를 T자로 그려주세요', '창문을 작은 원형으로 줄지어 그려주세요'],
  '로켓': ['긴 원통에 뾰족한 원뿔 머리를 달아주세요', '아래에 불꽃이 뿜어나오는 모습을 그리세요', '동체에 날개(fin)를 비스듬히 그려주세요'],
  '배': ['아래가 둥글고 위가 평평한 선체를 그리세요', '가운데 굴뚝이나 돛대를 세워주세요', '물 위에 떠있는 선과 파도를 그리면 완성돼요'],
  '기차': ['직사각형 차체를 연결해 길게 그리세요', '아래에 둥근 바퀴를 일정 간격으로 그려주세요', '앞에 연기 굴뚝과 엔진 부분을 강조하세요'],
  '버스': ['큰 직사각형 차체에 창문을 줄지어 그리세요', '앞 유리를 크게, 문을 측면에 그려주세요', '바퀴를 크고 검게 아래에 그려주세요'],
  '헬리콥터': ['좌우로 긴 프로펠러가 핵심이에요', '통통한 몸체와 긴 꼬리를 연결해 그리세요', '꼬리 끝에 작은 프로펠러를 세로로 그려주세요'],
  '오토바이': ['자전거보다 두꺼운 바퀴 두 개를 그리세요', '낮고 긴 차체와 핸들을 표현하세요', '배기관을 뒤쪽에 그리면 오토바이답게 보여요'],
  '잠수함': ['긴 타원형 몸체를 그리세요', '위에 잠망경(막대+작은 원)을 세워주세요', '아래 프로펠러와 날개를 그리면 완성돼요'],
  '트럭': ['큰 직사각형 짐칸에 작은 운전석을 앞에 붙이세요', '바퀴를 크게 여러 개 그려주세요', '짐칸을 비워 두거나 짐을 쌓아 표현하세요'],
  '스쿠터': ['작은 바퀴 두 개에 낮은 발판을 그리세요', '앞에 핸들을, 뒤에 앉는 자리를 표현하세요', '자전거보다 짧고 낮은 형태가 특징이에요'],
  '열기구': ['크고 둥근 풍선을 위에, 아래 바구니를 줄로 연결하세요', '풍선에 세로 색줄 무늬를 그려주세요', '불꽃이 바구니에서 풍선으로 올라가는 모습을 그려주세요'],
  '소방차': ['빨간 트럭 위에 사다리를 그려주세요', '호스와 사이렌을 차체에 표현하세요', '빨간 색이 가장 중요한 특징이에요'],
  '택시': ['노란 자동차에 TAXI 표시를 지붕에 그리세요', '노란색이 핵심이에요', '지붕 위 체커 패턴을 그리면 바로 알아봐요'],
  '킥보드': ['긴 막대 핸들에 발판 하나와 작은 바퀴를 그리세요', '앞바퀴 하나, 뒷바퀴 하나 형태로 그려주세요', '한 발로 타는 자세를 사람과 함께 그리면 더 명확해요'],
  // 자연·날씨
  '무지개': ['반원형 호를 7겹으로 겹쳐 그리세요', '빨주노초파남보 순서로 색을 칠해주세요', '구름 사이에서 뜨는 형태로 그리면 완벽해요'],
  '해': ['노란 원에 삼각형 빛줄기를 방사형으로 그리세요', '빛줄기를 8~12개 고르게 배치해주세요', '눈, 코, 입을 그리면 더 귀여워요'],
  '달': ['노란 초승달이나 둥근 보름달을 그리세요', '초승달은 C자로, 보름달은 크림색 원으로 그려주세요', '크레이터를 원형으로 몇 개 그리면 완성돼요'],
  '별': ['다섯 꼭짓점 별을 그리세요', '노란색으로 칠하면 바로 알아봐요', '여러 크기로 모아 그리면 더 인상적이에요'],
  '구름': ['여러 원을 겹쳐 솜사탕 모양으로 그리세요', '아래를 평평하게, 위를 구불구불하게 표현하세요', '흰색 또는 회색으로 채워주세요'],
  '번개': ['지그재그 모양의 노란 선을 그리세요', '구름에서 아래로 뻗어나오는 형태가 특징이에요', '두껍게 그리고 주변에 빛이 나는 효과를 넣어주세요'],
  '나무': ['갈색 직선 기둥 위에 초록 구름(잎)을 올리세요', '잎 부분을 삼각형이나 구름 모양으로 표현하세요', '기둥에 세로 줄을 그어 나무껍질을 표현하세요'],
  '꽃': ['중앙 원 주변에 꽃잎을 6~8개 방사형으로 그리세요', '줄기와 잎을 아래에 그려주세요', '밝은 색으로 칠하면 바로 알아봐요'],
  '버섯': ['반원형 빨간 갓 아래에 흰 기둥을 그리세요', '갓 위에 흰 점들을 뿌려주세요', '잔디 위에 서있는 모습으로 그리면 완성돼요'],
  '산': ['삼각형 또는 삐죽한 봉우리를 두세 개 겹쳐 그리세요', '꼭대기에 흰 눈을 덮어주세요', '아래를 초록으로, 위를 갈색으로 칠하면 자연스러워요'],
  '파도': ['물결 모양의 S자 곡선을 반복해서 그리세요', '파도 꼭대기에 부서지는 흰 거품을 표현하세요', '파란색으로 칠하면 바로 알아봐요'],
  '선인장': ['초록 기둥 형태에 짧은 가지를 양쪽으로 뻗어 그리세요', '온몸에 작은 가시(선)를 그려주세요', '화분에 꽂거나 사막 배경으로 그리면 더 명확해요'],
  '야자수': ['가느다란 긴 줄기를 약간 굽게 그리세요', '꼭대기에 큰 잎을 부채꼴로 펼쳐 그리세요', '줄기에 가로 띠 무늬를 그리면 완성돼요'],
  '불꽃': ['아래는 넓고 위는 뾰족하게 흔들리는 모양으로 그리세요', '주황-빨강-노랑이 섞인 그라데이션을 표현하세요', '여러 개 겹쳐 일렁이는 느낌을 주세요'],
  '눈결정': ['중앙에서 6방향으로 뻗는 대칭 패턴을 그리세요', '각 가지에 작은 가지를 더 추가하면 더 눈결정답게 보여요', '파란색이나 흰색으로 표현하세요'],
  '화산': ['삼각형 산 꼭대기에서 연기와 용암이 분출하는 모습을 그리세요', '용암을 빨간 줄기로 흘러내리게 표현하세요', '연기를 구불구불 위로 그려주세요'],
  '섬': ['작은 육지를 파란 바다 위에 그리세요', '야자수와 모래사장을 표현하면 바로 알아봐요', '위에서 본 모습처럼 동그란 육지 형태도 좋아요'],
  '강': ['두 줄의 물결 곡선을 평행하게 그리세요', '중간을 파란색으로 채워주세요', '구불구불한 형태로 그리면 더 강답게 보여요'],
  '폭포': ['위에서 아래로 굵은 흰 물줄기를 그리세요', '아래에 튀는 물방울과 물보라를 표현하세요', '절벽과 바위를 양쪽에 그리면 완성돼요'],
  '토네이도': ['위는 넓고 아래는 좁은 나선형 깔때기를 그리세요', '안에 원형 소용돌이 선을 그려주세요', '아래에서 먼지와 잔해가 날리는 모습을 표현하세요'],
  // 사물·생활
  '집': ['삼각형 지붕과 사각형 벽을 기본으로 그리세요', '문과 창문을 벽에 그려주세요', '굴뚝에서 연기가 나오면 더 귀여워요'],
  '우산': ['반원형 우산 위에 긴 손잡이를 그리세요', '아래는 J자로 구부러지게 표현해주세요', '줄을 삼각형으로 여러 칸 나눠주면 우산답게 보여요'],
  '안경': ['두 개의 원(렌즈)을 연결선으로 이어주세요', '양쪽에 귀에 걸치는 다리를 길게 그려주세요', '안경의 두 원이 동일한 크기여야 해요'],
  '모자': ['챙이 있는 경우 챙 위에 반원형 모체를 그리세요', '야구모자는 앞 챙을 비스듬히, 머리에 맞게 그리세요', '위쪽에 장식(리본, 버튼)을 추가하면 더 명확해요'],
  '연필': ['긴 직사각형 몸체에 끝을 뾰족한 삼각형으로 그리세요', '끝에 분홍 지우개를 그려주세요', '노란색으로 칠하면 바로 알아봐요'],
  '가위': ['두 개의 원(손잡이)에서 칼날이 교차하는 형태를 그리세요', '칼날 부분을 날카로운 삼각형으로 표현하세요', '두 날이 X자로 교차한 모습이 특징이에요'],
  '전화기': ['스마트폰은 직사각형에 화면을 그리세요', '수화기형은 S자 곡선 형태로 그리세요', '화면에 아이콘을 그리면 바로 알아봐요'],
  '시계': ['원형에 12개 눈금을 그리세요', '시침과 분침을 원 안에 그려주세요', '12, 3, 6, 9 숫자를 크게 표시하면 더 명확해요'],
  '책': ['직사각형 두 개를 약간 기울여 겹쳐 그리세요', '책등 부분을 두껍게 표현하세요', '표지에 선을 그어 제목 영역을 표시하면 완성돼요'],
  '기타': ['상단 직사각형 헤드에 줄이 감기는 페그를 그리세요', '8자 모양 몸통과 중앙 구멍을 그려주세요', '줄을 세로로 6개 그으면 완성돼요'],
  '피아노': ['측면에서 본 모습: 긴 직사각형 몸체를 그리세요', '위에 뚜껑을, 앞에 흰 건반과 검은 건반을 그려주세요', '다리 3개를 아래에 그리면 그랜드 피아노예요'],
  '축구공': ['흑백 오각형 패턴을 원 위에 그리세요', '검은 오각형 여러 개를 고르게 배치하세요', '원형 안에 패치 패턴을 표현하는 게 핵심이에요'],
  '눈사람': ['큰 원 위에 작은 원을 쌓으세요', '작은 원에 눈, 코(당근), 입을 그려주세요', '목에 목도리와 위에 모자를 그리면 완성돼요'],
  '하트': ['위에 두 개의 볼록한 반원, 아래를 뾰족하게 모아주세요', '대칭이 핵심이에요', '빨간색으로 채우면 바로 알아봐요'],
  '왕관': ['위가 뾰족한 여러 개의 삼각형이 이어진 띠를 그리세요', '보석을 끝마다 그려주세요', '금색으로 칠하면 완성돼요'],
  '칫솔': ['긴 직사각형 손잡이 끝에 작은 타원형 솔 부분을 그리세요', '솔 부분에 짧은 선을 촘촘히 그어 털을 표현하세요', '색깔로 칠하면 더 명확해요'],
  '컵': ['사다리꼴(위가 넓은)을 그리고 옆에 반원형 손잡이를 달아주세요', '컵 안에 음료를 채워주면 더 명확해요', '받침 접시를 아래에 그리면 찻잔이 돼요'],
  '열쇠': ['타원형 머리에 톱니 모양 몸체를 그리세요', '몸체 아래에 L자나 T자 모양 돌기를 그려주세요', '옛날 열쇠 모양이 가장 인식률이 높아요'],
  '가방': ['직사각형 몸체에 손잡이를 위에 달아주세요', '버클이나 잠금장치를 앞에 그리면 완성돼요', '학교 가방은 등에 매는 끈 두 개를 그려주세요'],
  '신발': ['옆면: 발 모양의 납작한 형태를 그리세요', '운동화는 앞을 둥글게, 밑창을 두껍게 그리세요', '끈을 X자로 교차해서 그려주세요'],
  '양말': ['발 모양으로 직각으로 꺾인 긴 통 모양을 그리세요', '발목 부분에 줄무늬를 그려주세요', '뒤꿈치 부분을 볼록하게 표현하세요'],
  '텐트': ['역삼각형(삼각형 지붕)에 양쪽 면을 그리세요', '앞에 입구를 반원이나 사각형으로 그려주세요', '밧줄이 양쪽으로 뻗어있으면 더 텐트답게 보여요'],
  '사다리': ['두 개의 평행한 긴 막대와 가로 발판을 그리세요', '발판을 일정 간격으로 그려주세요', '약간 기울어진 형태로 그리면 더 사실적이에요'],
  '망원경': ['두 개의 원통을 크기 다르게 겹쳐 그리세요', '삼각대 위에 올려놓은 형태가 가장 인식률이 높아요', '앞 렌즈를 크게 원형으로 표현하세요'],
  '나침반': ['원형 케이스 안에 N·S·E·W를 표시하세요', '중앙에 빨간 화살표 바늘을 그려주세요', '원형 외부에 눈금을 그리면 완성돼요'],
  '카메라': ['직사각형 몸체 정면에 큰 원형 렌즈를 그리세요', '위에 플래시와 뷰파인더를 그려주세요', '렌즈를 여러 동심원으로 표현하면 더 카메라답게 보여요'],
  '피리': ['긴 원통 형태를 그리세요', '위에 입김 부는 구멍을 표현하고 옆에 음공을 여러 개 그리세요', '입을 대는 리코더 형태가 가장 인식률이 높아요'],
  '드럼': ['원통형 드럼 여러 개를 스탠드에 연결해 그리세요', '위에 심벌(원형 플레이트)을 그려주세요', '드럼 스틱 두 개를 위에 올려두면 완성돼요'],
  '풍선': ['눈물방울 모양 원형 위에 짧은 줄을 달아주세요', '밝은 색으로 칠하면 바로 알아봐요', '여러 개를 묶어 그리면 더 인상적이에요'],
  '연': ['마름모 형태의 연 몸체를 그리세요', '중앙에 X자 골격을 그려주세요', '아래에 꼬리를 구불구불하게 그리면 완성돼요'],
  '낚싯대': ['긴 막대 끝에서 실이 내려오는 형태를 그리세요', '실 끝에 낚시바늘과 찌(부표)를 그려주세요', '물 위에 찌가 떠있는 모습이 핵심이에요'],
  '빗자루': ['긴 막대 아래에 삼각형으로 퍼진 솔을 그리세요', '솔 부분에 세로선을 촘촘히 그어 털을 표현하세요', '마녀가 타는 모습으로 그리면 더 인상적이에요'],
  '돋보기': ['원형 렌즈에 긴 손잡이를 비스듬히 달아주세요', '렌즈 내부에 빛 반사선을 그으면 유리처럼 보여요', '무언가를 확대하는 모습을 함께 그리면 더 명확해요'],
  '지구본': ['원형에 대륙 모양을 그리세요', '세로 경도선을 호 모양으로 그려주세요', '받침대와 축(기울어진 막대)을 그리면 완성돼요'],
  '트로피': ['컵 모양 몸체에 손잡이를 양쪽에 달아주세요', '아래에 받침대를 그려주세요', '노란색(금색)으로 칠하면 바로 알아봐요'],
  '로봇': ['사각형 몸체에 사각형 머리를 올리세요', '눈을 사각형이나 원형으로 그리세요', '팔을 직각으로 구부리고 안테나를 머리 위에 그리면 완성돼요'],
  '마법봉': ['긴 막대 끝에 별 모양을 달아주세요', '반짝이는 효과를 주변에 그려주세요', '금색이나 보라색으로 칠하면 더 마법봉답게 보여요'],
  '방패': ['위가 넓고 아래가 뾰족한 방패 형태를 그리세요', '중앙에 문장(십자나 별)을 그려주세요', '금속 테두리를 밝게 표현하면 완성돼요'],
  '닻': ['원 아래에 T자 모양 고리가 달린 앵커 형태를 그리세요', '양쪽에 휘어진 갈고리를 그려주세요', '고리에 밧줄을 감아 표현하면 더 명확해요'],
}

function getDrawingTips(subject: string): string[] {
  return DRAWING_TIPS[subject] ?? [
    '가장 특징적인 부분을 크고 단순하게 강조해보세요',
    '실루엣만 봐도 알 수 있도록 형태를 먼저 잡아보세요',
    '디테일보다 전체 비율과 특징이 더 중요해요',
  ]
}

function isMatch(guess: string, subject: string) {
  const g = guess.trim().toLowerCase()
  const s = subject.trim().toLowerCase()
  return g === s || g.includes(s) || s.includes(g)
}

const IconTimer = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconTarget = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
)
const IconBot = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M12 11V7" /><circle cx="12" cy="5" r="2" />
    <path d="M8 15h.01M12 15h.01M16 15h.01" strokeWidth="2.5" />
    <path d="M3 15h-.5M21 15h.5" />
  </svg>
)
const IconSparkle = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.9 5.5L19 10l-5.1 1.5L12 17l-1.9-5.5L5 10l5.1-1.5z" />
    <path d="M5 3l.8 2.2L8 6l-2.2.8L5 9l-.8-2.2L2 6l2.2-.8z" strokeWidth="1.5" />
  </svg>
)
const IconTrophy = ({ size = 56, color = '#d4a800' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5h4" /><path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
    <path d="M6 2h12v7a6 6 0 0 1-12 0V2z" />
    <path d="M12 15v4" /><path d="M8 19h8" />
    <path d="M9 15a6 6 0 0 0 6 0" />
  </svg>
)
const IconStar = ({ size = 56, color = '#d4a800', filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)
const IconSeedling = ({ size = 56, color = '#43aa8b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V12" />
    <path d="M12 12C12 12 7 10 5 6c3 0 6 1 7 6z" />
    <path d="M12 12c0 0 5-2 7-6-3 0-6 1-7 6z" />
  </svg>
)
const IconParty = ({ size = 56, color = '#d4a800' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.8 11.3 2 22l10.7-3.79" />
    <path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01M2 8h.01" strokeWidth="2.5" />
    <path d="M13.4 5 5.8 11.3l7.6 7.6 6.3-7.6-6.3-6.3z" />
    <path d="m13.4 5 3.6-1 1 3.5" />
    <path d="M5.8 11.3-1 3.9 3.5 1" />
  </svg>
)
const IconAlarm = ({ size = 56, color = '#e63946' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2" />
    <path d="M5 3 2 6M22 6l-3-3" />
    <path d="M6.38 18.7 4 21M17.64 18.7 20 21" />
  </svg>
)
const IconWarning = ({ size = 28, color = '#c8a000' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconCheck = ({ size = 14, color = '#43aa8b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconX = ({ size = 14, color = '#e63946' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

type GamePhase = 'intro' | 'ready' | 'drawing' | 'success' | 'timeout' | 'gameover'

interface Stroke {
  id: string
  points: number[]
  color: string
  strokeWidth: number
}

interface RoundResult {
  subject: string
  success: boolean
  guess: string
  imageDataUrl: string
}

const EraserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16l10-10 7 7-2.5 2.5" />
    <path d="M6.0001 17.0001 10 13" />
  </svg>
)
const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" /><path d="M3 13C5 7 10 4 16 5.5a9 9 0 0 1 5 7.5" />
  </svg>
)
const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6" /><path d="M21 13C19 7 14 4 8 5.5a9 9 0 0 0-5 7.5" />
  </svg>
)
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
)

export default function TimeAttack() {
  const navigate = useNavigate()
  const stageRef = useRef<any>(null)
  const isDrawingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const aiCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isCheckingRef = useRef(false)
  const strokesRef = useRef<Stroke[]>([])
  const currentRoundRef = useRef(0)
  const currentSubjectsRef = useRef<string[]>([])
  const gamePhaseRef = useRef<GamePhase>('intro')
  const currentAiGuessRef = useRef('')
  const aiCorrectRef = useRef(false)
  const strokeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doAiCheckRef = useRef<() => void>(() => {})

  const [stageContainerEl, setStageContainerEl] = useState<HTMLDivElement | null>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro')
  const [round, setRound] = useState(0)
  const [subjects, setSubjects] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND)
  const [aiGuess, setAiGuess] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [aiCorrect, setAiCorrect] = useState(false)
  const [roundResults, setRoundResults] = useState<RoundResult[]>([])
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showRetryModal, setShowRetryModal] = useState(false)
  const { tokenBalance, setTokenBalance } = useAuthStore()
  const [feedbackTarget, setFeedbackTarget] = useState<RoundResult | null>(null)
  const [feedbackReason, setFeedbackReason] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const [history, setHistory] = useState<Stroke[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const strokes = history[historyIndex]
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const [color, setColor] = useState('#1a1a2e')
  const [strokeWidth, setStrokeWidth] = useState(6)
  const [isEraser, setIsEraser] = useState(false)

  useEffect(() => {
    if (!stageContainerEl) return
    const update = () => setStageSize({ width: stageContainerEl.clientWidth, height: stageContainerEl.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(stageContainerEl)
    return () => ro.disconnect()
  }, [stageContainerEl])

  useEffect(() => { strokesRef.current = strokes }, [strokes])

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (aiCheckRef.current) { clearInterval(aiCheckRef.current); aiCheckRef.current = null }
    if (strokeDebounceRef.current) { clearTimeout(strokeDebounceRef.current); strokeDebounceRef.current = null }
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const captureDrawing = (): string => {
    if (!stageRef.current) return ''
    return stageRef.current.toDataURL({ pixelRatio: 1, mimeType: 'image/png' })
  }

  const handleSuccess = useCallback(() => {
    if (gamePhaseRef.current !== 'drawing') return
    gamePhaseRef.current = 'success'
    clearTimers()
    const imageDataUrl = captureDrawing()
    setScore(s => s + 1)
    setRoundResults(prev => [...prev, {
      subject: currentSubjectsRef.current[currentRoundRef.current],
      success: true,
      guess: currentAiGuessRef.current,
      imageDataUrl,
    }])
    setGamePhase('success')
  }, [clearTimers])

  const handleTimeout = useCallback(() => {
    if (gamePhaseRef.current !== 'drawing') return
    const success = aiCorrectRef.current
    gamePhaseRef.current = success ? 'success' : 'timeout'
    clearTimers()
    const imageDataUrl = captureDrawing()
    setRoundResults(prev => [...prev, {
      subject: currentSubjectsRef.current[currentRoundRef.current],
      success,
      guess: currentAiGuessRef.current,
      imageDataUrl,
    }])
    if (success) setScore(s => s + 1)
    setGamePhase(success ? 'success' : 'timeout')
  }, [clearTimers])

  const startRound = useCallback((roundIndex: number, subjectList: string[]) => {
    currentRoundRef.current = roundIndex
    currentSubjectsRef.current = subjectList
    gamePhaseRef.current = 'ready'
    strokesRef.current = []
    isCheckingRef.current = false
    currentAiGuessRef.current = ''
    aiCorrectRef.current = false

    setRound(roundIndex)
    setHistory([[]])
    setHistoryIndex(0)
    setCurrentPoints([])
    setTimeLeft(TIME_PER_ROUND)
    setAiGuess('')
    setAiCorrect(false)
    setIsEraser(false)
    setIsChecking(false)
    setGamePhase('ready')
  }, [])

  const startDrawing = useCallback(() => {
    if (gamePhaseRef.current !== 'ready') return
    gamePhaseRef.current = 'drawing'
    setGamePhase('drawing')

    let t = TIME_PER_ROUND
    timerRef.current = setInterval(() => {
      t--
      setTimeLeft(t)
      if (t <= 0) handleTimeout()
    }, 1000)

    // AI 체크 공통 함수 — ref에 등록해서 폴링·디바운스 양쪽에서 호출
    const doCheck = async () => {
      if (isCheckingRef.current || !stageRef.current) return
      if (strokesRef.current.length < 1) return
      if (gamePhaseRef.current !== 'drawing') return
      isCheckingRef.current = true
      setIsChecking(true)
      try {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1, mimeType: 'image/png' })
        const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
        const res = await identifyCanvas(base64)
        const guess = res.data.subject
        currentAiGuessRef.current = guess
        setAiGuess(guess)
        // 정답이어도 바로 넘기지 않고 플래그만 세움
        if (!aiCorrectRef.current && isMatch(guess, currentSubjectsRef.current[currentRoundRef.current])) {
          aiCorrectRef.current = true
          setAiCorrect(true)
        }
      } catch {
        // silent
      } finally {
        isCheckingRef.current = false
        setIsChecking(false)
      }
    }
    doAiCheckRef.current = doCheck

    // 백업 폴링 (2초마다)
    aiCheckRef.current = setInterval(doCheck, CHECK_INTERVAL_MS)
  }, [handleTimeout])

  const startGame = useCallback(() => {
    const subjectList = pickSubjects(TOTAL_ROUNDS)
    setSubjects(subjectList)
    setScore(0)
    setRoundResults([])
    startRound(0, subjectList)
  }, [startRound])

  const nextRound = useCallback(() => {
    const next = currentRoundRef.current + 1
    if (next >= TOTAL_ROUNDS) {
      gamePhaseRef.current = 'gameover'
      setGamePhase('gameover')
    } else {
      startRound(next, currentSubjectsRef.current)
    }
  }, [startRound])

  const handlePointerDown = useCallback((e: KonvaEventObject<PointerEvent>) => {
    isDrawingRef.current = true
    const pos = e.target.getStage()!.getPointerPosition()!
    setCurrentPoints([pos.x, pos.y])
  }, [])

  const handlePointerMove = useCallback((e: KonvaEventObject<PointerEvent>) => {
    if (!isDrawingRef.current) return
    const pos = e.target.getStage()!.getPointerPosition()!
    setCurrentPoints(prev => [...prev, pos.x, pos.y])
  }, [])

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current || currentPoints.length < 4) {
      isDrawingRef.current = false
      setCurrentPoints([])
      return
    }
    isDrawingRef.current = false
    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      points: currentPoints,
      color: isEraser ? '#ffffff' : color,
      strokeWidth: isEraser ? 28 : strokeWidth,
    }
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1)
      return [...next, [...prev[historyIndex], newStroke]]
    })
    setHistoryIndex(i => i + 1)
    setCurrentPoints([])

    // 스트로크 완료 후 700ms 뒤 AI 즉시 체크 (디바운스)
    if (gamePhaseRef.current === 'drawing') {
      if (strokeDebounceRef.current) clearTimeout(strokeDebounceRef.current)
      strokeDebounceRef.current = setTimeout(() => doAiCheckRef.current(), STROKE_DEBOUNCE_MS)
    }
  }, [currentPoints, color, strokeWidth, isEraser, historyIndex])

  useEffect(() => {
    const onUp = () => { if (isDrawingRef.current) handlePointerUp() }
    window.addEventListener('pointerup', onUp)
    return () => window.removeEventListener('pointerup', onUp)
  }, [handlePointerUp])

  const handleUndo = () => { if (historyIndex > 0) setHistoryIndex(i => i - 1) }
  const handleRedo = () => { if (historyIndex < history.length - 1) setHistoryIndex(i => i + 1) }
  const handleClear = () => { setHistory([[]]); setHistoryIndex(0); setCurrentPoints([]) }

  const currentSubject = subjects[round] ?? ''
  const timerColor = timeLeft > 20 ? '#43aa8b' : timeLeft > 10 ? '#c8a000' : '#e63946'
  const isDrawingPhase = gamePhase === 'ready' || gamePhase === 'drawing' || gamePhase === 'success' || gamePhase === 'timeout'

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .ta-btn-glow { transition: box-shadow 0.2s, transform 0.15s, filter 0.2s; }
        .ta-btn-glow:hover { box-shadow: 0 0 20px 4px rgba(212,168,0,0.45); filter: brightness(1.07); transform: scale(1.02); }
        .ta-btn-glow:active { transform: scale(0.97); filter: brightness(0.97); }
        .ta-btn-soft { transition: box-shadow 0.2s, transform 0.15s; }
        .ta-btn-soft:hover { box-shadow: 0 0 12px 3px rgba(212,168,0,0.25); transform: scale(1.02); }
        .ta-btn-soft:active { transform: scale(0.97); }
        @keyframes ta-spin { to { transform: rotate(360deg); } }
        @keyframes ta-pop { 0% { transform: scale(0.75); opacity: 0; } 60% { transform: scale(1.06); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes ta-shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-7px); } 40%,80% { transform: translateX(7px); } }
        @keyframes ta-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
        @media (max-width: 600px) {
          .ta-logo { height: 19px !important; }
          .ta-color-btn { width: 18px !important; height: 18px !important; }
          .ta-color-picker { width: 18px !important; height: 18px !important; }
          .ta-width-btn { width: 26px !important; height: 26px !important; }
          .ta-icon-btn { width: 28px !important; height: 28px !important; }
          .ta-hide-mobile { display: none !important; }
          .ta-subject-label { display: none !important; }
          .ta-drawings-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ta-gameover-card { padding: 24px 20px !important; }
          .ta-gameover-score { font-size: 34px !important; }
          .ta-intro-card { padding: 32px 24px !important; }
        }
      `}</style>

      <div style={{
        height: '100vh', overflow: 'hidden',
        background: 'linear-gradient(135deg, #fdf8d0 0%, #fef9e0 50%, #fffde8 100%)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Segoe UI', sans-serif", position: 'relative',
      }}>

        {/* ── INTRO ── */}
        {gamePhase === 'intro' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="ta-intro-card" style={{
              background: 'white', borderRadius: 32, padding: '44px 48px',
              maxWidth: 460, width: '90%', textAlign: 'center',
              boxShadow: '0 24px 64px rgba(212,168,0,0.2)',
              border: '1.5px solid rgba(212,168,0,0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
              animation: 'ta-pop 0.4s ease',
            }}>
              <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 27 }} />
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#d4a800', letterSpacing: 2, textTransform: 'uppercase' }}>
                  Time Attack
                </p>
                <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: '#3a2a00', letterSpacing: -1 }}>
                  시간초 그림판
                </h1>
              </div>
              <div style={{
                background: 'rgba(254,249,195,0.8)', borderRadius: 16, padding: '16px 24px',
                border: '1px solid rgba(212,168,0,0.25)', width: '100%', boxSizing: 'border-box',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                  {[
                    { icon: <IconTimer size={18} color="#c8a000" />, text: '30초 안에 제시어를 그려요' },
                    { icon: <IconTarget size={18} color="#c8a000" />, text: `총 ${TOTAL_ROUNDS}문제를 풀어요` },
                    { icon: <IconBot size={18} color="#c8a000" />, text: 'AI가 실시간으로 그림을 맞춰요' },
                    { icon: <IconSparkle size={18} color="#c8a000" />, text: '시간이 끝날 때까지 마음껏 그려요!' },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
                      <span style={{ fontSize: 14, color: '#5a4400', fontWeight: 500 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="ta-btn-glow" onClick={startGame} style={{
                width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg, #d4a800, #b08800)',
                color: 'white', fontSize: 18, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(212,168,0,0.4)', letterSpacing: -0.3,
              }}>
                시작하기!
              </button>
              <button onClick={() => navigate('/')}
                style={{ background: 'none', border: 'none', color: '#c8a000', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                홈으로 돌아가기
              </button>
            </div>
          </div>
        )}

        {/* ── GAMEOVER ── */}
        {gamePhase === 'gameover' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px' }}>
            <div className="ta-gameover-card" style={{
              background: 'white', borderRadius: 32, padding: '40px 44px',
              maxWidth: 820, width: '100%',
              boxShadow: '0 24px 64px rgba(212,168,0,0.25)',
              border: '1.5px solid rgba(212,168,0,0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
              animation: 'ta-pop 0.4s ease',
            }}>
              {/* Score header */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 12 }}>
                  {score === TOTAL_ROUNDS
                  ? <IconTrophy size={64} color="#d4a800" />
                  : score >= 3 ? <IconStar size={64} color="#d4a800" filled />
                  : score >= 2 ? <IconStar size={64} color="#d4a800" />
                  : <IconSeedling size={64} color="#43aa8b" />}
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#d4a800', fontWeight: 700, letterSpacing: 1 }}>게임 종료!</p>
                <h2 className="ta-gameover-score" style={{ margin: '0 0 4px', fontSize: 44, fontWeight: 900, color: '#1a1a2e', letterSpacing: -2 }}>
                  {score} <span style={{ fontSize: 20, color: '#9ca3af', fontWeight: 500 }}>/ {TOTAL_ROUNDS}</span>
                </h2>
                <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>
                  {score === TOTAL_ROUNDS ? '완벽해요! 천재 화가 🎨'
                    : score >= 3 ? '훌륭해요! 거의 다 맞혔어요!'
                    : score >= 2 ? '잘했어요! 조금만 더 연습해봐요'
                    : score >= 1 ? '아쉬워요! 다시 도전해봐요'
                    : '그래도 수고했어요! 다시 도전!'}
                </p>
              </div>

              {/* 4 drawings grid */}
              {roundResults.length > 0 && (
                <div style={{ width: '100%' }}>
                  <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#c8a000', textAlign: 'center', letterSpacing: 0.5 }}>
                    내가 그린 그림들
                  </p>
                  <div className="ta-drawings-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12,
                  }}>
                    {roundResults.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setFeedbackTarget(r)
                          setFeedbackReason('')
                          setFeedbackLoading(true)
                          const base64 = r.imageDataUrl.replace(/^data:image\/\w+;base64,/, '')
                          identifyCanvas(base64)
                            .then(res => setFeedbackReason(res.data.reason ?? ''))
                            .catch(() => setFeedbackReason(''))
                            .finally(() => setFeedbackLoading(false))
                        }}
                        style={{
                          display: 'flex', flexDirection: 'column', gap: 6,
                          borderRadius: 16, overflow: 'hidden',
                          border: `2px solid ${r.success ? 'rgba(67,170,139,0.4)' : 'rgba(230,57,70,0.3)'}`,
                          background: r.success ? 'rgba(67,170,139,0.04)' : 'rgba(230,57,70,0.04)',
                          cursor: 'pointer',
                          transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.04)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}
                      >
                        {r.imageDataUrl ? (
                          <div style={{ position: 'relative' }}>
                            <img
                              src={r.imageDataUrl}
                              alt={r.subject}
                              style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'contain', background: 'white', display: 'block' }}
                            />
                            <div style={{
                              position: 'absolute', inset: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(0,0,0,0)', transition: 'background 0.2s',
                              borderRadius: 0,
                            }} className="drawing-hover-overlay">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0, transition: 'opacity 0.2s' }} className="drawing-zoom-icon">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div style={{ width: '100%', aspectRatio: '1 / 1', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconBot size={28} color="#d1d5db" />
                          </div>
                        )}
                        <div style={{ padding: '6px 10px 10px', textAlign: 'center' }}>
                          <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 900, color: '#1a1a2e' }}>{r.subject}</p>
                          <p style={{ margin: 0, fontSize: 11, color: r.success ? '#43aa8b' : '#e63946', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                            {r.success ? <><IconCheck size={12} color="#43aa8b" /> 성공</> : <><IconX size={12} color="#e63946" /> 실패</>}
                          </p>
                          <p style={{ margin: '3px 0 0', fontSize: 10, color: '#c8a000', fontWeight: 600 }}>클릭해서 피드백 보기</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button className="ta-btn-soft" onClick={() => setShowRetryModal(true)} style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  border: '1.5px solid #fde68a', background: 'white',
                  color: '#c8a000', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}>
                  다시 하기
                </button>
                <button className="ta-btn-glow" onClick={() => navigate('/')} style={{
                  flex: 1, padding: '14px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #d4a800, #b08800)',
                  color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(212,168,0,0.35)',
                }}>
                  홈으로
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DRAWING AREA (position:absolute to fill screen) ── */}
        {isDrawingPhase && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 16px',
              background: 'linear-gradient(135deg, #fdf8d0 0%, #fef9e0 50%, #fffde8 100%)',
              borderBottom: '1.5px solid rgba(212,168,0,0.3)',
              flexWrap: 'wrap', flexShrink: 0,
            }}>
              <img src="/Egag_logo-removebg.png" alt="EgAg"
                className="ta-logo"
                style={{ height: 30, cursor: 'pointer', marginRight: 2 }}
                onClick={() => setShowExitConfirm(true)}
              />

              <div style={{ width: 1, height: 28, background: '#fde68a', margin: '0 2px' }} />

              {/* Subject */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'rgba(253,230,138,0.55)', borderRadius: 12,
                padding: '5px 14px', border: '1.5px solid rgba(212,168,0,0.3)',
              }}>
                <span className="ta-subject-label" style={{ fontSize: 11, color: '#92700a', fontWeight: 700, letterSpacing: 0.5 }}>제시어</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#3a2600', letterSpacing: -0.5 }}>
                  {currentSubject}
                </span>
              </div>

              {/* Timer */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: gamePhase === 'ready' ? 'rgba(212,168,0,0.08)' : `${timerColor}12`,
                borderRadius: 12,
                padding: '5px 14px',
                border: gamePhase === 'ready' ? '1.5px solid rgba(212,168,0,0.2)' : `1.5px solid ${timerColor}35`,
                transition: 'all 0.5s',
                animation: gamePhase !== 'ready' && timeLeft <= 5 ? 'ta-pulse 0.7s ease infinite' : 'none',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={gamePhase === 'ready' ? '#c8a000' : timerColor} strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span style={{
                  fontSize: 22, fontWeight: 900,
                  color: gamePhase === 'ready' ? '#c8a000' : timerColor,
                  letterSpacing: -0.5, minWidth: 26, textAlign: 'center', transition: 'color 0.5s',
                }}>
                  {gamePhase === 'ready' ? TIME_PER_ROUND : timeLeft}
                </span>
              </div>

              {/* Round dots */}
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
                  <div key={i} style={{
                    width: 9, height: 9, borderRadius: '50%',
                    background: i < round ? '#d4a800' : i === round ? '#d4a800' : '#fde68a',
                    opacity: i === round ? 1 : i < round ? 0.7 : 0.35,
                    border: i === round ? '2px solid #b08800' : '2px solid transparent',
                    transition: 'all 0.3s',
                  }} />
                ))}
                <span style={{ fontSize: 11, color: '#c8a000', fontWeight: 600, marginLeft: 2 }}>
                  {round + 1}/{TOTAL_ROUNDS}
                </span>
              </div>

              <div style={{ flex: 1 }} />

              {/* Colors */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {COLORS.map(c => (
                  <button key={c} className="ta-color-btn" onClick={() => { setColor(c); setIsEraser(false) }}
                    style={{
                      width: 22, height: 22, borderRadius: '50%', background: c,
                      padding: 0, cursor: 'pointer', border: 'none', boxSizing: 'border-box',
                      outline: !isEraser && color === c ? '2.5px solid #d4a800' : '2px solid #fde68a',
                      outlineOffset: !isEraser && color === c ? 2 : 0,
                      transform: !isEraser && color === c ? 'scale(1.22)' : 'scale(1)',
                      transition: 'transform 0.15s, outline-offset 0.15s',
                      boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #fde68a' : 'none',
                    }}
                  />
                ))}
                <label className="ta-color-picker" style={{ position: 'relative', width: 22, height: 22, cursor: 'pointer', flexShrink: 0 }} title="색상 선택">
                  <div className="ta-color-picker" style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                    outline: !isEraser && !COLORS.includes(color) ? '2.5px solid #d4a800' : '2px solid #fde68a',
                    outlineOffset: !isEraser && !COLORS.includes(color) ? 2 : 0,
                    transform: !isEraser && !COLORS.includes(color) ? 'scale(1.22)' : 'scale(1)',
                    transition: 'transform 0.15s',
                  }} />
                  <input type="color" value={color}
                    onChange={e => { setColor(e.target.value); setIsEraser(false) }}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                  />
                </label>
              </div>

              <div style={{ width: 1, height: 24, background: '#fde68a', margin: '0 2px' }} />

              {/* Widths */}
              <div className="ta-hide-mobile" style={{ display: 'flex', gap: 4 }}>
                {WIDTHS.map(w => (
                  <button key={w} className="ta-width-btn" onClick={() => { setStrokeWidth(w); setIsEraser(false) }}
                    style={{
                      width: 32, height: 32, borderRadius: 8, padding: 0,
                      border: !isEraser && strokeWidth === w ? '2px solid #d4a800' : '1.5px solid #fde68a',
                      background: !isEraser && strokeWidth === w ? '#fef9c3' : 'white',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <div style={{
                      width: Math.min(w + 4, 20), height: Math.min(w, 12), borderRadius: 99,
                      background: !isEraser && strokeWidth === w ? '#d4a800' : '#fde68a',
                    }} />
                  </button>
                ))}
              </div>

              <div style={{ width: 1, height: 24, background: '#fde68a', margin: '0 2px' }} />

              {/* Eraser */}
              <button className="ta-icon-btn" onClick={() => setIsEraser(v => !v)}
                style={{
                  width: 34, height: 34, borderRadius: 8, padding: 0,
                  border: isEraser ? '2px solid #d4a800' : '1.5px solid #fde68a',
                  background: isEraser ? '#fef9c3' : 'white',
                  cursor: 'pointer', color: isEraser ? '#d4a800' : '#c8a000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="지우개"
              >
                <EraserIcon />
              </button>

              {/* Undo / Redo */}
              {[
                { icon: <UndoIcon />, onClick: handleUndo, disabled: historyIndex === 0 },
                { icon: <RedoIcon />, onClick: handleRedo, disabled: historyIndex === history.length - 1 },
              ].map(({ icon, onClick, disabled }, i) => (
                <button key={i} className="ta-icon-btn" onClick={onClick} disabled={disabled}
                  style={{
                    width: 34, height: 34, borderRadius: 8, padding: 0,
                    border: '1.5px solid #fde68a', background: 'white',
                    cursor: disabled ? 'default' : 'pointer',
                    color: disabled ? '#fde68a' : '#c8a000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {icon}
                </button>
              ))}

              {/* Clear */}
              <button onClick={handleClear}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 11px', borderRadius: 8,
                  border: '1.5px solid #fde68a', background: 'white',
                  fontSize: 12, cursor: 'pointer', color: '#c8a000', fontWeight: 600, flexShrink: 0,
                }}
              >
                <TrashIcon /> <span className="ta-hide-mobile">지우기</span>
              </button>

              {/* Skip */}
              <button onClick={handleTimeout}
                style={{
                  padding: '6px 12px', borderRadius: 8, flexShrink: 0,
                  border: '1.5px solid rgba(212,168,0,0.35)', background: 'rgba(254,249,195,0.5)',
                  fontSize: 12, cursor: 'pointer', color: '#92700a', fontWeight: 600,
                }}
              >
                건너뛰기
              </button>
            </div>

            {/* AI guess bar — hidden during ready phase */}
            <div style={{
              display: gamePhase === 'ready' ? 'none' : 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '4px 20px', flexShrink: 0,
              background: aiCorrect ? 'rgba(67,170,139,0.08)' : 'rgba(254,249,195,0.65)',
              borderBottom: `1px solid ${aiCorrect ? 'rgba(67,170,139,0.2)' : 'rgba(212,168,0,0.12)'}`,
              fontSize: 13, color: '#92700a', minHeight: 28,
              transition: 'background 0.4s, border-color 0.4s',
            }}>
              {aiCorrect ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#43aa8b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" fill="rgba(67,170,139,0.12)" stroke="#43aa8b" />
                    <polyline points="8 12 11 15 16 9" />
                  </svg>
                  <span style={{ color: '#43aa8b', fontWeight: 700 }}>AI가 맞혔어요!</span>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>계속 그려봐요</span>
                  <button
                    onClick={handleTimeout}
                    style={{
                      marginLeft: 8, padding: '3px 12px', borderRadius: 8,
                      border: '1.5px solid rgba(67,170,139,0.4)',
                      background: 'rgba(67,170,139,0.12)',
                      color: '#2d8c72', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    다음으로
                  </button>
                </>
              ) : isChecking ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4a800" strokeWidth="2.5"
                    style={{ animation: 'ta-spin 0.9s linear infinite', flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <span>AI가 그림 분석 중...</span>
                </>
              ) : aiGuess ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>AI가 보기엔...</span>
                  <span style={{ fontWeight: 800, color: '#3a2600', fontSize: 14 }}>"{aiGuess}"</span>
                </>
              ) : (
                <span style={{ color: '#c8a000', opacity: 0.7 }}>그림을 그리면 AI가 실시간으로 맞춰봐요!</span>
              )}
            </div>

            {/* Canvas — fills remaining space */}
            <div ref={setStageContainerEl} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                style={{
                  display: 'block',
                  cursor: gamePhase === 'drawing' ? (isEraser ? 'cell' : "url('/pencil-cursor.svg') 5 27, crosshair") : 'default',
                  touchAction: 'none',
                }}
                onPointerDown={gamePhase === 'drawing' ? handlePointerDown : undefined}
                onPointerMove={gamePhase === 'drawing' ? handlePointerMove : undefined}
                onPointerUp={gamePhase === 'drawing' ? handlePointerUp : undefined}
              >
                <Layer>
                  <Rect x={0} y={0} width={stageSize.width} height={stageSize.height} fill="white" />
                  {strokes.map(s => (
                    <Line key={s.id} points={s.points} stroke={s.color} strokeWidth={s.strokeWidth}
                      lineCap="round" lineJoin="round" tension={0.4} />
                  ))}
                  {currentPoints.length > 0 && (
                    <Line points={currentPoints} stroke={isEraser ? '#ffffff' : color}
                      strokeWidth={isEraser ? 28 : strokeWidth} lineCap="round" lineJoin="round" tension={0.4} />
                  )}
                </Layer>
              </Stage>
              {/* ── READY overlay (click to start) ── */}
              {gamePhase === 'ready' && (
                <div
                  onClick={startDrawing}
                  style={{
                    position: 'absolute', inset: 0, zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(253,248,208,0.82)', backdropFilter: 'blur(3px)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    textAlign: 'center', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 20,
                    animation: 'ta-pop 0.35s ease',
                  }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#c8a000', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                      제시어
                    </p>
                    <h2 style={{
                      margin: 0, fontSize: 'clamp(48px, 10vw, 80px)', fontWeight: 900,
                      color: '#3a2600', letterSpacing: -2, lineHeight: 1,
                    }}>
                      {currentSubject}
                    </h2>
                    <div style={{
                      marginTop: 8,
                      background: 'linear-gradient(135deg, #d4a800, #b08800)',
                      borderRadius: 20, padding: '14px 40px',
                      boxShadow: '0 6px 20px rgba(212,168,0,0.4)',
                      animation: 'ta-pulse 1.8s ease infinite',
                    }}>
                      <span style={{ fontSize: 17, fontWeight: 800, color: 'white', letterSpacing: -0.3 }}>
                        화면을 클릭해서 시작!
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#92700a', opacity: 0.8 }}>
                      <IconTimer size={13} color="#c8a000" /> 준비되면 클릭하세요 · {TIME_PER_ROUND}초
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SUCCESS overlay ── */}
        {gamePhase === 'success' && (
          <Overlay>
            <div style={{
              background: 'white', borderRadius: 28, padding: '40px 48px',
              maxWidth: 400, width: '90%', textAlign: 'center',
              boxShadow: '0 24px 64px rgba(212,168,0,0.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              animation: 'ta-pop 0.4s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconParty size={60} color="#d4a800" /></div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 14, color: '#43aa8b', fontWeight: 700 }}>정답!</p>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 900, color: '#1a1a2e', letterSpacing: -0.5 }}>
                  {currentSubject}
                </p>
              </div>
              {aiGuess && (
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                  AI가 <strong style={{ color: '#43aa8b' }}>"{aiGuess}"</strong>로 맞혔어요!
                </p>
              )}
              <div style={{ display: 'flex', gap: 5 }}>
                {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: i <= round ? '#d4a800' : '#fde68a',
                    opacity: i <= round ? 1 : 0.4,
                  }} />
                ))}
              </div>
              <button className="ta-btn-glow" onClick={nextRound} style={{
                padding: '13px 36px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #d4a800, #b08800)',
                color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(212,168,0,0.35)',
              }}>
                {round + 1 < TOTAL_ROUNDS ? '다음 문제' : '결과 보기'}
              </button>
            </div>
          </Overlay>
        )}

        {/* ── EXIT CONFIRM ── */}
        {showExitConfirm && (
          <Overlay>
            <div style={{
              background: 'white', borderRadius: 28, padding: '36px 40px',
              width: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              boxShadow: '0 24px 64px rgba(212,168,0,0.25)', textAlign: 'center',
              animation: 'ta-pop 0.3s ease',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'linear-gradient(135deg, #fef9c3, #fef3c7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              }}>
                <IconWarning size={28} color="#c8a000" />
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#1a1a2e' }}>홈으로 나갈까요?</p>
              <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                진행 중인 게임이 사라져요.<br />정말 나가시겠어요?
              </p>
              <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
                <button
                  className="ta-btn-soft"
                  onClick={() => setShowExitConfirm(false)}
                  style={{
                    flex: 1, padding: '13px 0', borderRadius: 14,
                    border: '1.5px solid #fde68a', background: 'white',
                    color: '#c8a000', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  계속 할게요
                </button>
                <button
                  className="ta-btn-glow"
                  onClick={() => { clearTimers(); navigate('/') }}
                  style={{
                    flex: 1, padding: '13px 0', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg, #d4a800, #b08800)',
                    color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(212,168,0,0.35)',
                  }}
                >
                  나갈게요
                </button>
              </div>
            </div>
          </Overlay>
        )}

        {/* ── RETRY TOKEN MODAL ── */}
        {showRetryModal && (
          <div
            onClick={() => setShowRetryModal(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 500,
              background: 'rgba(10,8,20,0.6)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'rgba(255,255,255,0.97)',
                borderRadius: 28, padding: '40px 36px',
                width: '100%', maxWidth: 380,
                boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                textAlign: 'center',
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(212,168,0,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
              }}>
                <Ticket size={26} color="#b08800" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#1a1a2e', letterSpacing: -0.5 }}>
                토큰 1개가 필요해요
              </h3>
              <p style={{ fontSize: 14, color: '#8a8aaa', lineHeight: 1.75, margin: '4px 0 8px' }}>
                시간초 그림판을 다시 시작할 때 토큰 1개가 차감돼요.
                <br />현재 보유 토큰 <strong style={{ color: '#4a5a7a' }}>{tokenBalance}개</strong>
              </p>
              <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
                <button
                  onClick={() => setShowRetryModal(false)}
                  style={{
                    flex: 1, padding: '13px', fontSize: 15, fontWeight: 600,
                    background: 'none', border: '1.5px solid #e2e8f0',
                    borderRadius: 14, cursor: 'pointer', color: '#8a8aaa',
                  }}
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await consumeToken()
                      setTokenBalance(res.tokenBalance)
                    } catch {
                      alert('토큰이 부족합니다.')
                      return
                    }
                    setShowRetryModal(false)
                    startGame()
                  }}
                  style={{
                    flex: 1, padding: '13px', fontSize: 15, fontWeight: 700,
                    background: 'linear-gradient(135deg, #d4a800, #b08800)',
                    border: 'none', borderRadius: 14, cursor: 'pointer', color: '#fff',
                  }}
                >
                  시작할게요!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DRAWING FEEDBACK MODAL ── */}
        {feedbackTarget && (
          <Overlay onClick={() => setFeedbackTarget(null)}>
            <div
              style={{
                background: 'white', borderRadius: 32,
                padding: '36px 36px',
                maxWidth: 520, width: '92%',
                boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
                display: 'flex', flexDirection: 'column', gap: 20,
                animation: 'ta-pop 0.35s ease',
                maxHeight: '90vh', overflowY: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#c8a000', letterSpacing: 1 }}>AI 피드백</p>
                  <h3 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 900, color: '#1a1a2e', letterSpacing: -0.5 }}>
                    {feedbackTarget.subject}
                    <span style={{
                      marginLeft: 10, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: feedbackTarget.success ? 'rgba(67,170,139,0.12)' : 'rgba(230,57,70,0.1)',
                      color: feedbackTarget.success ? '#43aa8b' : '#e63946',
                    }}>
                      {feedbackTarget.success ? '성공' : '실패'}
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() => setFeedbackTarget(null)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #fde68a',
                    background: 'white', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#c8a000',
                  }}
                >
                  <IconX size={16} color="#c8a000" />
                </button>
              </div>

              {/* Drawing */}
              {feedbackTarget.imageDataUrl && (
                <img
                  src={feedbackTarget.imageDataUrl}
                  alt={feedbackTarget.subject}
                  style={{
                    width: '100%', borderRadius: 20,
                    border: `2px solid ${feedbackTarget.success ? 'rgba(67,170,139,0.3)' : 'rgba(230,57,70,0.2)'}`,
                    background: 'white', display: 'block',
                    objectFit: 'contain',
                  }}
                />
              )}

              {/* AI guess vs subject */}
              <div style={{
                display: 'flex', gap: 10,
              }}>
                <div style={{
                  flex: 1, borderRadius: 14, padding: '14px 16px',
                  background: 'rgba(254,249,195,0.6)', border: '1.5px solid rgba(212,168,0,0.2)',
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#c8a000', letterSpacing: 0.5 }}>제시어</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#3a2600' }}>{feedbackTarget.subject}</p>
                </div>
                <div style={{
                  flex: 1, borderRadius: 14, padding: '14px 16px',
                  background: feedbackTarget.success ? 'rgba(67,170,139,0.08)' : 'rgba(230,57,70,0.06)',
                  border: `1.5px solid ${feedbackTarget.success ? 'rgba(67,170,139,0.25)' : 'rgba(230,57,70,0.2)'}`,
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: feedbackTarget.success ? '#43aa8b' : '#e63946', letterSpacing: 0.5 }}>AI 판정</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1a1a2e' }}>{feedbackTarget.guess || '—'}</p>
                </div>
              </div>

              {/* AI가 본 것 */}
              {(feedbackLoading || feedbackReason) && (
                <div style={{
                  borderRadius: 14, padding: '14px 16px',
                  background: 'rgba(107,130,160,0.07)',
                  border: '1.5px solid rgba(107,130,160,0.18)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    {feedbackLoading ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b82a0" strokeWidth="2.5"
                        style={{ animation: 'ta-spin 0.9s linear infinite', flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                    ) : (
                      <IconBot size={15} color="#6b82a0" />
                    )}
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#6b82a0', letterSpacing: 0.3 }}>AI가 본 것</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#4a5a7a', lineHeight: 1.75 }}>
                    {feedbackLoading ? '분석 중...' : feedbackReason}
                  </p>
                </div>
              )}

              {/* 그림 팁 */}
              <div style={{
                borderRadius: 16, padding: '18px 20px',
                background: 'linear-gradient(135deg, #fdf8d0 0%, #fffde8 100%)',
                border: '1.5px solid rgba(212,168,0,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <IconSparkle size={16} color="#c8a000" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#92700a' }}>이렇게 그려보세요</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {getDrawingTips(feedbackTarget.subject).map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{
                        flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                        background: 'rgba(212,168,0,0.2)', border: '1.5px solid rgba(212,168,0,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, color: '#c8a000', marginTop: 1,
                      }}>
                        {i + 1}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#5a4400', lineHeight: 1.7 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setFeedbackTarget(null)}
                style={{
                  padding: '13px', borderRadius: 14, border: '1.5px solid #fde68a',
                  background: 'white', fontSize: 15, fontWeight: 700,
                  color: '#c8a000', cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>
          </Overlay>
        )}

        {/* ── TIMEOUT overlay ── */}
        {gamePhase === 'timeout' && (
          <Overlay>
            <div style={{
              background: 'white', borderRadius: 28, padding: '40px 48px',
              maxWidth: 400, width: '90%', textAlign: 'center',
              boxShadow: '0 24px 64px rgba(212,168,0,0.25)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              animation: 'ta-shake 0.4s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconAlarm size={60} color="#e63946" /></div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 14, color: '#e63946', fontWeight: 700 }}>시간 초과!</p>
                <p style={{ margin: '0 0 2px', fontSize: 13, color: '#9ca3af' }}>정답은</p>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 900, color: '#1a1a2e', letterSpacing: -0.5 }}>
                  {currentSubject}
                </p>
              </div>
              {aiGuess && (
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                  AI의 마지막 추측: <strong>"{aiGuess}"</strong>
                </p>
              )}
              <button className="ta-btn-glow" onClick={nextRound} style={{
                padding: '13px 36px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #d4a800, #b08800)',
                color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(212,168,0,0.35)',
              }}>
                {round + 1 < TOTAL_ROUNDS ? '다음 문제' : '결과 보기'}
              </button>
            </div>
          </Overlay>
        )}
      </div>
    </div>
  )
}

function Overlay({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(30,24,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}
    >
      {children}
    </div>
  )
}
