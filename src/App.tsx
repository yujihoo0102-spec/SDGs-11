import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowUpRight, BadgeCheck, Bug, Building2, CalendarDays,
  Check, ChevronDown, Clock3, Cloud, CloudDrizzle, CloudRain, CloudSun, Droplets, Fan,
  Footprints, HeartPulse, MapPin, Moon, Shield, ShieldAlert, Shirt, ShoppingBag, Bell, X,
  Sun, Umbrella, Wind,
} from 'lucide-react'
import { translate as translateText, type Language } from './i18n'

type WeatherData = {
  temperature: number
  feelsLike: number
  humidity: number
  rainChance: number
  rainfall: number
  pm10: number
  pm25: number
  aqi: number
  wind: number
  code: number
  updatedAt: string
}
type HourlyForecast = { time: string; temperature: number; feelsLike: number; rainChance: number; code: number }
type DailyForecast = { date: string; code: number; max: number; min: number; rainChance: number }
type ForecastData = { hourly: HourlyForecast[]; daily: DailyForecast[] }
type Mode = 'live' | 'rain' | 'heat' | 'clear'
type Place = {
  name: string
  area: string
  category: string
  detail: string
  residentAccess: string
  hours: string
  recommendations: string[]
  mapQuery: string
  googleMapsUrl: string
  mapEmbedUrl: string
  icon: typeof Building2
}
type DiseaseId = 'dengue' | 'respiratory' | 'flu' | 'waterborne' | 'heat'
type FirstAidId = 'heat' | 'choking' | 'bleeding' | 'fainting'
type Disease = {
  id: DiseaseId
  name: string
  text: string
  icon: typeof Bug
  background: string
  symptoms: string[]
  preventionStages: { label: string; steps: string[] }[]
  localAdvice: string
}
type RiskLevel = '주의' | '경계' | '높음'

const sample: WeatherData = {
  temperature: 29, feelsLike: 34, humidity: 76, rainChance: 25, rainfall: 0,
  pm10: 42, pm25: 28, aqi: 72, wind: 11, code: 2, updatedAt: '',
}
const morningNotificationTimes = ['06:30', '07:00', '07:30', '08:00'] as const
const notificationEnabledStorageKey = 'hanoi-morning-notification-enabled'
const notificationTimeStorageKey = 'hanoi-morning-notification-time'
const notificationSentDateStorageKey = 'hanoi-morning-notification-sent-date'

const hanoiDateAndTime = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value
  const year = part('year')
  const month = part('month')
  const day = part('day')
  const hour = part('hour')
  const minute = part('minute')
  if (!year || !month || !day || !hour || !minute) throw new Error('하노이 현지 시각을 확인하지 못했습니다.')
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` }
}
const diseases: Disease[] = [
  {
    id: 'dengue',
    name: '뎅기열',
    text: '비가 오고 습한 날에는 모기 노출을 줄이세요.',
    icon: Bug,
    background: '하노이의 우기와 고온다습한 날씨에는 물이 고인 곳에서 모기가 번식하기 쉽습니다. 뎅기열 매개 모기는 낮에도 활동하므로 주간 외출과 주거지 주변 노출을 함께 줄이세요.',
    symptoms: ['갑작스러운 고열과 심한 두통', '눈 뒤쪽 통증, 근육·관절통', '메스꺼움 또는 피부 발진', '심한 복통·반복 구토·잇몸 출혈(위험 신호)'],
    preventionStages: [
      { label: '외출 전', steps: ['DEET 또는 이카리딘 성분 기피제를 제품 표시와 사용 연령에 맞게 바르기', '팔·다리를 덮는 얇고 밝은색 긴 옷 선택하기'] },
      { label: '외출 중', steps: ['모기가 많은 녹지·그늘에서는 낮에도 기피제를 표시된 간격에 따라 덧바르기', '방충망이 없는 곳에서는 모기장·선풍기로 모기 접근 줄이기'] },
      { label: '생활 습관', steps: ['화분 받침·양동이·배수 용기 등 고인 물을 주기적으로 비우기', '물 저장 용기는 덮고 집 주변 방충망 상태 확인하기'] },
    ],
    localAdvice: '뎅기열이 의심되면 의료기관에 연락해 진료와 혈액검사 필요성을 확인하세요. 출혈 위험 때문에 아스피린·이부프로펜 등 NSAIDs는 복용하지 마세요. 해열·통증 조절은 의료진 또는 약사와 확인한 뒤 아세트아미노펜(파라세타몰)을 제품 표시 용량대로만 사용하세요. 간 질환이 있거나 다른 복합약을 복용 중이면 먼저 전문가에게 확인하세요. 심한 복통, 지속 구토, 출혈, 호흡곤란, 심한 무기력은 즉시 응급 진료가 필요합니다.',
  },
  {
    id: 'respiratory',
    name: '급성 호흡기 질환·천식',
    text: '대기질이 나쁘거나 습도 변화가 큰 날 호흡기를 보호하세요.',
    icon: Wind,
    background: '하노이 건기에는 대기 정체와 교통·공사 먼지로 미세먼지 농도가 오를 수 있고, 오염물질과 습도 변화가 눈·코·목 점막을 자극합니다. 천식·알레르기·심폐질환이 있다면 더 민감할 수 있습니다.',
    symptoms: ['눈·코·목 따가움, 재채기·콧물', '마른기침 또는 목 통증', '쌕쌕거림·가슴 답답함', '호흡곤란 또는 평소보다 심해진 천식 증상'],
    preventionStages: [
      { label: '외출 전', steps: ['AQI가 나쁜 날에는 외출·야외 운동 시간을 줄이고 실내 활동 선택하기', '필요한 외출에는 얼굴에 밀착되는 KF94 등 보건용 마스크 준비하기'] },
      { label: '외출 중', steps: ['민감군은 AQI 101 이상에서 특히 장시간·격렬한 활동 피하기', '마스크를 코와 턱까지 밀착하고 오염이 심한 도로변 체류 줄이기'] },
      { label: '귀가 후·실내', steps: ['손·얼굴을 씻고 코 세척은 멸균·증류수 또는 끓였다 식힌 물로 하기', '바깥 공기질이 나쁠 때는 창문을 닫고 공기청정기를 가동하며 필터 확인하기'] },
    ],
    localAdvice: '천식 환자는 평소 처방받은 흡입기와 행동 계획을 따르세요. 일반 수돗물로 코 세척을 하지 말고 안전한 물을 사용하세요. 숨이 차거나 흉통이 있거나 입술이 파래지는 경우, 처방 흡입기로 호전되지 않는 경우 즉시 응급 진료를 받으세요. 증상이 지속되면 의료진에게 AQI와 증상 시작 시점을 알려 주세요.',
  },
  {
    id: 'flu',
    name: '계절성 독감',
    text: '환절기와 사람이 많은 실내에서는 호흡기 감염 예방에 신경 써요.',
    icon: ShieldAlert,
    background: '하노이의 건기·겨울철에는 일교차가 커지고, 환기가 부족한 실내와 혼잡한 대중교통에서 호흡기 바이러스가 퍼지기 쉽습니다. 독감과 일반 상기도 감염은 증상만으로 구분하기 어려울 수 있습니다.',
    symptoms: ['갑작스러운 발열·오한', '기침·인후통·콧물', '두통·근육통과 심한 피로감', '숨이 차거나 호전 후 다시 악화되는 증상'],
    preventionStages: [
      { label: '생활 습관', steps: ['비누와 흐르는 물로 손가락 사이·손톱 밑까지 30초 이상 씻기', '예방접종 가능 여부와 시기는 의료기관에 문의하기'] },
      { label: '외출 중', steps: ['혼잡하거나 환기가 어려운 실내에서는 마스크 착용 고려하기', '기침·재채기는 옷소매로 가리고 얼굴을 만지지 않기'] },
      { label: '귀가 후·실내', steps: ['손을 씻고 자주 만지는 표면을 청결히 하기', '실내 습도는 대체로 40–60% 범위에서 유지하고 주기적으로 환기하기'] },
    ],
    localAdvice: '고열이 지속되거나 호흡곤란·흉통이 있으면 진료를 받으세요. 임신부, 고령자, 영유아, 만성질환자는 증상 초기에 의료진과 상담하는 편이 좋습니다. 항생제는 바이러스성 독감에 효과가 없으므로 임의로 복용하지 말고, 처방약·해열제는 의료진 또는 약사에게 확인하세요.',
  },
  {
    id: 'waterborne',
    name: '수인성·식중독 질환',
    text: '폭우·고온다습한 날에는 물과 음식의 위생 상태를 확인하세요.',
    icon: Droplets,
    background: '폭우·침수와 고온다습한 날씨는 식수·조리 환경의 오염과 음식 부패 위험을 높일 수 있습니다. 출처가 불분명한 식수·얼음·조리 상태가 불확실한 음식은 여행자 설사와 식중독 위험 요인입니다.',
    symptoms: ['묽은 설사 또는 복통·경련', '메스꺼움·구토', '발열', '심한 갈증·소변 감소·어지럼 등 탈수 징후'],
    preventionStages: [
      { label: '먹기 전', steps: ['밀봉이 온전한 생수나 끓인 물을 선택하고 길거리 얼음 피하기', '생채소·껍질째 먹는 과일은 세척수와 취급 상태를 확인하고 의심되면 피하기'] },
      { label: '식사 중', steps: ['음식은 충분히 익혀 뜨거울 때 먹고 상온에 오래 둔 음식 피하기', '덜 익힌 고기·해산물과 비살균 유제품 피하기'] },
      { label: '생활 습관', steps: ['식사 전과 화장실 이용 후 비누로 손 씻기', '침수된 물은 마시거나 조리에 사용하지 않기'] },
    ],
    localAdvice: '설사·구토가 있으면 밀봉 생수로 만든 경구수분보충액(ORS)을 제품 설명대로 조금씩 자주 마시세요. 혈변, 지속되는 고열, 심한 복통, 소변 감소·의식 저하 등 탈수 징후가 있거나 물도 유지하지 못하면 의료기관을 방문하세요. 항생제나 지사제를 임의로 복용하기보다 먼저 의료진과 상담하세요.',
  },
  {
    id: 'heat',
    name: '열사병·온열질환',
    text: '체감온도가 높을 때는 한낮 야외 활동과 탈수를 조심하세요.',
    icon: Sun,
    background: '하노이의 덥고 습한 날씨와 폭염 시뮬레이션에서는 땀이 잘 증발하지 않아 체온 조절이 어려워질 수 있습니다. 한낮 야외 노동·운동, 탈수, 냉방 없는 공간 체류가 위험을 높입니다.',
    symptoms: ['두통·어지럼·메스꺼움', '심한 갈증·근육 경련·무기력', '뜨거운 피부와 빠른 맥박', '혼란·실신·경련(응급 신호)'],
    preventionStages: [
      { label: '외출 전', steps: ['폭염 시간대 야외 활동을 조정하고 물과 가벼운 옷 준비하기', '냉방 가능한 장소를 미리 확인하기'] },
      { label: '외출 중', steps: ['그늘이나 냉방 공간에서 자주 쉬고 갈증 전부터 물을 조금씩 마시기', '동행자의 어지럼·혼란 등 증상을 서로 확인하기'] },
      { label: '생활 습관', steps: ['통풍되는 옷을 입고 한낮 격한 운동 피하기', '실내를 시원하게 유지하고 취약한 이웃의 안부 확인하기'] },
    ],
    localAdvice: '열사병이 의심되면 즉시 응급 도움을 요청하고, 시원한 장소로 옮겨 옷을 느슨하게 한 뒤 몸을 식히세요. 의식이 흐리거나 구토하는 사람에게 억지로 물을 먹이지 마세요. 혼자 이동하기보다 가까운 사람에게 도움을 요청하세요.',
  },
]
const dailyHealthTasks = [
  '외출할 때 보건용 마스크 챙기기',
  '물병을 챙겨 수분 자주 보충하기',
  '야외 활동 전 모기 기피제 사용하기',
  '길거리 얼음과 개봉된 생수 피하기',
]
const firstAidGuides: { id: FirstAidId; title: string; icon: typeof HeartPulse; steps: string[]; avoid: string[]; emergency?: string }[] = [
  {
    id: 'heat',
    title: '폭염·열사병 의심',
    icon: Sun,
    steps: ['즉시 115에 연락하고 그늘이나 냉방되는 실내로 옮깁니다.', '겉옷·조이는 옷을 느슨하게 하고 피부를 시원한 물로 적셔 바람을 쐽니다.', '목·겨드랑이·사타구니에 천으로 감싼 냉찜질을 대며 상태를 계속 살핍니다.', '의식이 또렷하고 삼킬 수 있을 때만 시원한 물을 조금씩 마시게 합니다.'],
    avoid: ['혼란·의식 저하·구토가 있으면 물이나 음식을 먹이지 마세요.', '의식 저하를 단순 탈진으로 보고 기다리지 말고 응급 도움을 요청하세요.'],
    emergency: '의식 혼란, 경련, 실신 또는 매우 뜨거운 피부는 열사병 응급 신호입니다.',
  },
  {
    id: 'choking',
    title: '기도 폐쇄·질식',
    icon: Wind,
    steps: ['강하게 기침하거나 말할 수 있으면 계속 기침하도록 격려하고 곁에서 관찰합니다.', '기침·말·호흡이 불가능하면 115에 연락시키고, 성인·1세 이상은 견갑골 사이를 손바닥 뒤꿈치로 최대 5회 두드립니다.', '막힘이 풀리지 않으면 배꼽 위·흉골 아래에 주먹을 대고 안쪽·위쪽으로 복부 밀어내기를 최대 5회 시행합니다. 풀릴 때까지 5회씩 번갈아 반복합니다.', '임신 후기 또는 복부를 감싸기 어려운 경우 복부 대신 가슴 밀어내기를 사용합니다. 의식을 잃으면 바닥에 눕혀 CPR을 시작합니다.'],
    avoid: ['입안에 보이지 않는 물체를 손가락으로 훑지 마세요.', '영아(1세 미만)는 복부 밀어내기를 하지 말고 영아 응급처치 지침과 115 안내를 따르세요.'],
    emergency: '의식이 없어지면 즉시 115에 신고하고 CPR을 시작하세요. 물체가 보일 때만 제거합니다.',
  },
  {
    id: 'bleeding',
    title: '출혈·상처·화상',
    icon: Shield,
    steps: ['상처 출혈은 깨끗한 거즈나 천으로 상처를 직접 강하게 눌러 지혈합니다. 젖어도 처음 댄 천을 떼지 말고 위에 덧댑니다.', '출혈이 멎으면 깨끗한 물로 작은 상처를 씻고 드레싱합니다. 깊거나 벌어진 상처는 의료기관에서 확인합니다.', '화상은 가능한 한 빨리 흐르는 시원한 물로 20분간 식힙니다.', '반지·시계 등 조이는 물건을 붓기 전에 빼고, 식힌 뒤 깨끗하고 들러붙지 않는 천으로 느슨하게 덮습니다.'],
    avoid: ['화상에 얼음·기름·치약을 대지 말고 물집을 터뜨리지 마세요.', '상처에 박힌 물체는 빼지 말고 주변을 눌러 응급 진료를 받으세요.', '피가 멈추지 않거나 분출성 출혈·넓은 화상이면 115에 연락하세요.'],
  },
  {
    id: 'fainting',
    title: '실신·어지러움·저혈당·탈수',
    icon: Activity,
    steps: ['주변 위험을 치우고 바닥에 눕혀 호흡과 의식 반응을 확인합니다. 부상이 의심되지 않으면 다리를 약간 높입니다.', '의식이 없지만 정상 호흡을 하면 기도가 막히지 않도록 옆으로 눕히는 회복 자세를 취하고 호흡을 계속 살핍니다.', '의식이 또렷하고 안전하게 삼킬 수 있으며 저혈당이 의심되면 포도당 정제나 당이 든 음료를 제공하고 호전 여부를 확인합니다.', '탈수가 의심되지만 의식이 또렷하면 물이나 경구수분보충액을 조금씩 마시게 합니다.'],
    avoid: ['의식이 흐리거나 삼키기 어려운 사람에게 음식·음료·당을 입으로 주지 마세요.', '호흡이 없거나 정상적이지 않으면 회복 자세 대신 115 신고와 CPR을 시작하세요.', '넘어져 머리·목·척추 손상이 의심되면 불필요하게 옮기지 마세요.'],
    emergency: '의식이 돌아오지 않음, 흉통, 호흡곤란, 경련, 한쪽 마비 또는 반복 실신은 즉시 응급 상황입니다.',
  },
]
const place = (
  name: string,
  area: string,
  category: string,
  detail: string,
  residentAccess: string,
  hours: string,
  recommendations: string[],
  mapQuery: string,
  icon: typeof Building2,
): Place => ({
  name, area, category, detail, residentAccess, hours, recommendations, mapQuery, icon,
  googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${mapQuery} Hanoi`)}`,
  mapEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(`${mapQuery} Hanoi`)}&output=embed`,
})
const places: Place[] = [
  place('더 가든 쇼핑몰 (The Garden)', '미딩·송다', '쇼핑몰', '미딩·송다 한인 상업권에 있는 대형 실내 쇼핑몰과 식음 공간입니다.', '미딩·송다 주거권과 가까우며 주변 한인마트·약국·한국어 응대 의료기관은 위치와 영업 여부를 확인하세요.', '통상 매일 10:00–22:00 · 매장별 상이', ['폭염: 냉방되는 실내에서 쉬기 좋습니다.', '폭우: 실내 대기 장소로 활용하고, 주변 도로 침수 시 이동을 삼가세요.', '미세먼지: 실내로 대피하되 공기 여과 운영은 시설에 확인하세요.'], 'The Garden Shopping Center My Dinh Hanoi', ShoppingBag),
  place('경남 랜드마크72 (Keangnam Landmark 72)', '미딩·송다', '복합시설', '오피스·상업시설이 모인 대형 복합 건물로 주변 편의시설 접근이 편리합니다.', '미딩 한인 거주·업무권에 인접합니다. 한국어 가능 병원·약국은 건물 내 입점 및 운영 여부를 사전에 확인하세요.', '시설·매장별 상이 · 방문 전 확인', ['폭염: 냉방되는 실내 상업공간에서 휴식하기 좋습니다.', '폭우: 실내에서 대기하고 지하주차장·지하 동선은 침수 우려 시 피하세요.', '미세먼지: 실내 체류가 가능하며 공기청정 여부는 시설에 확인하세요.'], 'Keangnam Hanoi Landmark Tower Hanoi', Building2),
  place('빈홈 가드니아 상가·커뮤니티 (Vinhomes Gardenia)', '미딩·송다', '상가·커뮤니티', '주거 단지 내 상가와 커뮤니티 시설을 이용할 수 있는 생활 거점입니다.', '단지 내 편의시설에 접근하기 쉽습니다. 상가·커뮤니티 개방 범위와 외부인 이용 가능 여부를 확인하세요.', '단지·상가별 상이 · 방문 전 확인', ['폭염: 가까운 단지 내 실내 시설을 이용할 수 있는지 확인하세요.', '폭우: 단지 내 안전한 실내 공간에 머물고 저지대·지하 주차장은 피하세요.', '미세먼지: 실내 시설 이용 전 환기·공기 여과 상태를 확인하세요.'], 'Vinhomes Gardenia Hanoi', Building2),
  place('빈콤 센터 쩐주이흥 (Vincom Center Tran Duy Hung)', '중화·인친', '쇼핑몰', '쩐주이흥 대로에 위치한 쇼핑·식음 중심의 대형 실내 복합 공간입니다.', '중화·인친 한인 거주권에서 접근할 수 있으며 주변 마트·약국·의료기관은 영업시간과 언어 지원을 별도 확인하세요.', '통상 매일 10:00–22:00 · 매장별 상이', ['폭염: 대형 냉방 실내 공간에서 휴식하기 좋습니다.', '폭우: 실내 대기 장소로 이용하되 도로 침수 상황을 확인하세요.', '미세먼지: 실내에 머물기 좋으며 공기 여과 여부는 시설에 확인하세요.'], 'Vincom Center Tran Duy Hung Hanoi', ShoppingBag),
  place('GO! 탕롱 (GO! Thang Long)', '중화·인친', '쇼핑몰', '대형 마트와 실내 상업시설이 함께 있는 생활 밀착형 거점입니다.', '중화·인친 권역의 장보기·생활 편의시설과 인접합니다. 약국·병원 및 한국어 응대 여부는 현장에서 확인하세요.', '통상 매일 08:00–22:00 · 매장별 상이', ['폭염: 냉방되는 매장 실내에서 잠시 쉬어갈 수 있습니다.', '폭우: 실내에서 대기하고 침수된 도로·지하 진입로는 피하세요.', '미세먼지: 실내 체류에 활용하고 공기 여과 운영은 확인하세요.'], 'GO! Thang Long Hanoi', ShoppingBag),
  place('중화 한인타운 주요 실내 복합상가', '중화·인친', '상가·커뮤니티', '중화·인친 한인타운 일대의 실내 상가를 찾기 위한 권역 거점입니다.', '한인 식당·마트·약국이 모인 상업권과 인접합니다. 특정 건물이 아닌 권역 검색이므로 방문할 상가와 한국어 지원 여부를 확인하세요.', '상가·매장별 상이 · 방문 전 확인', ['폭염: 가까운 냉방 실내 상가를 이용하세요.', '폭우: 실내에 머물되 배수 상태가 불확실한 지하 공간은 피하세요.', '미세먼지: 실내에 머물고 공기 여과 여부를 확인하세요.'], 'Trung Hoa Nhan Chinh indoor shopping area Hanoi', Building2),
  place('롯데몰 웨스트레이크 하노이 (Lotte Mall West Lake)', '스타레이크·외교단지', '쇼핑몰', '떠이호 서쪽의 대형 복합 쇼핑몰로 실내 상업·휴식 공간을 갖추고 있습니다.', '스타레이크·떠이호 지역에서 이동 가능한 대형 거점입니다. 외교단지 출입·교통 상황과 주변 의료·약국 운영을 확인하세요.', '통상 매일 09:30–22:00 · 매장별 상이', ['폭염: 넓은 냉방 실내에서 머물기 좋습니다.', '폭우: 실내 대기 장소로 활용하고 호숫가·저지대 침수 여부를 확인하세요.', '미세먼지: 실내 공간으로 대피하되 공기 여과 수준은 시설에 확인하세요.'], 'Lotte Mall West Lake Hanoi', ShoppingBag),
  place('스타레이크 상업지구 실내 시설 (Starlake)', '스타레이크·외교단지', '상가·커뮤니티', '스타레이크 신도시 내 상업시설을 찾을 때 참고할 권역 거점입니다.', '외교단지·스타레이크 주거권에 인접합니다. 시설별 개장 여부, 대중 접근 가능 여부와 인근 약국 운영을 확인하세요.', '시설·상가별 상이 · 방문 전 확인', ['폭염: 영업 중인 냉방 실내 시설을 확인해 이용하세요.', '폭우: 실내에서 대기하되 저지대·지하 통로는 피하고 현장 안내를 따르세요.', '미세먼지: 실내 체류가 가능하며 공기 여과 여부를 시설에 확인하세요.'], 'Starlake Tay Ho Tay Hanoi commercial area', Building2),
  place('빈컴 메가몰 로얄시티 (Vincom Mega Mall Royal City)', '탄쑤언·로얄시티', '쇼핑몰', '지하에 대형 복합 쇼핑 공간이 있는 로얄시티 내 쇼핑몰입니다.', '탄쑤언 주거권의 대형 실내 거점입니다. 지하 공간은 폭염 시 이용할 수 있지만 침수 위험이 있거나 폭우 경보 시 진입하지 마세요.', '통상 매일 09:30–22:00 · 매장별 상이', ['폭염: 대형 냉방 실내 공간에서 쉬기 좋습니다.', '폭우: 지하 공간은 침수 위험이 있으므로 대피처로 단정하지 말고 지상 대피·당국 안내를 우선하세요.', '미세먼지: 실내 체류에 활용하고 공기 여과 여부는 시설에 확인하세요.'], 'Vincom Mega Mall Royal City Hanoi', ShoppingBag),
  place('빈컴 메가몰 스마트시티 (Vincom Mega Mall Smart City)', '빈홈 그린베이·스마트시티', '쇼핑몰', '빈홈 스마트시티 내 쇼핑·식음·생활 편의시설이 모인 실내 거점입니다.', '스마트시티 단지 거주자와 주변 그린베이 권역에서 이용할 수 있습니다. 이동 거리와 약국·의료기관 영업 여부를 확인하세요.', '통상 매일 10:00–22:00 · 매장별 상이', ['폭염: 냉방되는 실내 공간에서 휴식하기 좋습니다.', '폭우: 실내 대기 장소로 이용하고 단지 내 침수·교통 안내를 확인하세요.', '미세먼지: 실내에 머물 수 있으며 공기 여과 여부는 시설에 확인하세요.'], 'Vincom Mega Mall Smart City Hanoi', ShoppingBag),
]
const createSampleForecast = (): ForecastData => {
  const hanoiDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const start = new Date(`${hanoiDate}T00:00:00+07:00`)
  const startHour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
  const rainByHour = [15, 10, 5, 5, 5, 10, 20, 35, 40, 35, 25, 20, 15, 20, 30, 45, 55, 60, 50, 35, 25, 20, 20, 15]
  const hourly = Array.from({ length: 24 }, (_, offset) => {
    const hour = (startHour + offset) % 24
    const temperature = Math.round(27 + 4 * Math.sin(((hour - 7) / 24) * Math.PI * 2))
    const time = new Date(start.getTime() + (startHour + offset) * 60 * 60 * 1000 + 7 * 60 * 60 * 1000).toISOString().slice(0, 16)
    return {
      time,
      temperature,
      feelsLike: Math.round(temperature + (temperature >= 28 ? 2 : 1)),
      rainChance: rainByHour[hour],
      code: rainByHour[hour] >= 50 ? 61 : hour >= 10 && hour <= 15 ? 2 : 3,
    }
  })
  const dailyRain = [20, 35, 15, 45, 25, 30, 10]
  const daily = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(start.getTime() + offset * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    return { date, code: [2, 61, 3, 80, 2, 61, 1][offset], max: [32, 30, 31, 29, 32, 30, 33][offset], min: [25, 24, 25, 24, 25, 24, 25][offset], rainChance: dailyRain[offset] }
  })
  return { hourly, daily }
}
const areas = ['전체 보기', '미딩·송다', '중화·인친', '스타레이크·외교단지', '탄쑤언·로얄시티', '빈홈 그린베이·스마트시티']
const codeText = (code: number) => code === 0 ? '맑음' : code < 3 ? '구름 조금' : code < 50 ? '흐림' : code < 70 ? '이슬비' : code < 80 ? '비' : '소나기'
const qualityText = (aqi: number) => aqi <= 50 ? '좋음' : aqi <= 100 ? '보통' : aqi <= 150 ? '나쁨' : '매우 나쁨'
const airQualityRanges = [
  { label: '좋음', aqi: '0–50', pm10: '0–54', pm25: '0–9.0' },
  { label: '보통', aqi: '51–100', pm10: '55–154', pm25: '9.1–35.4' },
  { label: '나쁨', aqi: '101–150', pm10: '155–254', pm25: '35.5–55.4' },
  { label: '매우 나쁨', aqi: '151 이상', pm10: '255 이상', pm25: '55.5 이상' },
]
const pollutantQuality = (value: number, goodMax: number, moderateMax: number, badMax: number) =>
  value <= goodMax ? '좋음' : value <= moderateMax ? '보통' : value <= badMax ? '나쁨' : '매우 나쁨'
const weatherIcon = (code: number, size = 20) => code === 0 ? <Sun size={size} /> : code < 3 ? <CloudSun size={size} /> : code < 50 ? <Cloud size={size} /> : code < 70 ? <CloudDrizzle size={size} /> : <CloudRain size={size} />
const forecastTime = (time: string, language: Language) => `${time.slice(11, 13)}${language === 'ko' ? '시' : 'h'}`
const forecastDay = (date: string, language: Language) =>
  new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
const dayWeatherNote = (day: DailyForecast) => day.rainChance >= 60 || day.code >= 80
  ? '소나기·비 우산 챙기기'
  : day.rainChance >= 35 || day.code >= 51
    ? '비 소식 우산 권장'
    : day.max - day.min >= 9
      ? '일교차 큼 얇은 겉옷'
      : day.max >= 34
        ? '한낮 더위 수분 보충'
        : day.code <= 2
          ? '맑고 쾌적한 편'
          : '구름 많음 무난한 날'

function HourlyChart({ points, language }: { points: HourlyForecast[]; language: Language }) {
  const [selected, setSelected] = useState<number | null>(null)
  const minTemperature = Math.floor(Math.min(...points.map(point => point.temperature)) - 2)
  const maxTemperature = Math.ceil(Math.max(...points.map(point => point.temperature)) + 2)
  const chart = { x: 54, y: 30, width: 700, height: 205 }
  const x = (index: number) => chart.x + (index / Math.max(points.length - 1, 1)) * chart.width
  const y = (temperature: number) => chart.y + ((maxTemperature - temperature) / (maxTemperature - minTemperature)) * chart.height
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.temperature)}`).join(' ')
  const area = `${path} L ${x(points.length - 1)} ${chart.y + chart.height} L ${chart.x} ${chart.y + chart.height} Z`
  const selectAtPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const svg = event.currentTarget.querySelector('svg')
    if (!svg) return
    const bounds = svg.getBoundingClientRect()
    const chartX = ((event.clientX - bounds.left) / bounds.width) * 800
    const relativeX = Math.max(0, Math.min(1, (chartX - chart.x) / chart.width))
    setSelected(Math.round(relativeX * (points.length - 1)))
  }
  const clearPointerSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setSelected(null)
  }
  const active = selected === null ? null : points[selected]
  const activeIndex = selected ?? -1
  return (
    <div className="hourly-chart-wrap" onPointerMove={selectAtPointer} onPointerDown={selectAtPointer} onPointerLeave={clearPointerSelection}>
      {active && <div className="chart-tooltip" style={{ left: `${Math.min(91, Math.max(9, (activeIndex / Math.max(points.length - 1, 1)) * 100))}%` }}>
        <strong>{forecastTime(active.time, language)} · {translateText(language, codeText(active.code))}</strong>
        <span>{translateText(language, '기온')} {active.temperature}°C · {translateText(language, '체감 온도')} {active.feelsLike}°C</span>
        <span>{translateText(language, '강수 확률')} {active.rainChance}%</span>
      </div>}
      <svg className="hourly-chart" viewBox="0 0 800 300" role="img" aria-label={translateText(language, '향후 24시간 예보 그래프')}>
        {[0, 1, 2, 3].map(step => {
          const gridY = chart.y + (step / 3) * chart.height
          const temperature = Math.round(maxTemperature - (step / 3) * (maxTemperature - minTemperature))
          return <g key={step}><line x1={chart.x} x2={chart.x + chart.width} y1={gridY} y2={gridY} stroke="#edf0f5" strokeDasharray="4 5" /><text x="3" y={gridY + 3} className="chart-axis-label">{temperature}°</text><text x="765" y={gridY + 3} className="chart-axis-label">{100 - step * 33}%</text></g>
        })}
        {points.map((point, index) => {
          const barHeight = (point.rainChance / 100) * chart.height
          return <rect key={`rain-${point.time}`} x={x(index) - 6} y={chart.y + chart.height - barHeight} width="12" height={barHeight} rx="5" fill="#78b8d7" opacity=".68" />
        })}
        <path d={area} fill="#0f766e" fillOpacity=".08" />
        <path d={path} fill="none" stroke="#0f766e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => <circle
          key={`temp-${point.time}`}
          cx={x(index)}
          cy={y(point.temperature)}
          r={selected === index ? 7 : index % 3 === 0 ? 5 : 3.2}
          fill={selected === index ? '#fff3df' : '#fff'}
          stroke={selected === index ? '#c87920' : '#0f766e'}
          strokeWidth={selected === index ? 3 : 2}
          tabIndex={0}
          role="button"
          aria-label={translateText(language, '시간대별 기온 {temperature}도, 체감 {feelsLike}도, 강수확률 {rainChance}퍼센트, {weather}').replace('{temperature}', String(point.temperature)).replace('{feelsLike}', String(point.feelsLike)).replace('{rainChance}', String(point.rainChance)).replace('{weather}', translateText(language, codeText(point.code)))}
          onFocus={() => setSelected(index)}
        />)}
        {points.filter((point, index) => Number(point.time.slice(11, 13)) % 3 === 0 || index === 0).map(point => {
          const index = points.indexOf(point)
          return <text key={`time-${point.time}`} x={x(index)} y="274" textAnchor="middle" className="chart-axis-label">{forecastTime(point.time, language)}</text>
        })}
      </svg>
      <div className="chart-legend"><span><i className="legend-temp" />{translateText(language, '기온')} (°C)</span><span><i className="legend-rain" />{translateText(language, '강수 확률')} (%)</span><span className="chart-hint">{translateText(language, '그래프를 가리키거나 터치해 시간별 정보를 확인하세요')}</span></div>
    </div>
  )
}

function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = window.localStorage.getItem('hanoi-app-language')
    return savedLanguage === 'vi' || savedLanguage === 'en' ? savedLanguage : 'ko'
  })
  const [weather, setWeather] = useState<WeatherData>(sample)
  const [mode, setMode] = useState<Mode>('live')
  const [activeSection, setActiveSection] = useState<'home' | 'forecast' | 'air' | 'outfit' | 'places' | 'health'>('home')
  const [airDetailsOpen, setAirDetailsOpen] = useState(false)
  const [alertsCollapsed, setAlertsCollapsed] = useState(false)
  const [completedWeatherChecks, setCompletedWeatherChecks] = useState<string[]>([])
  const [area, setArea] = useState('전체 보기')
  const [category, setCategory] = useState('전체 장소')
  const [selectedPlace, setSelectedPlace] = useState(places[0].name)
  const [usingSample, setUsingSample] = useState(false)
  const [now, setNow] = useState(new Date())
  const [forecast, setForecast] = useState<ForecastData>(() => createSampleForecast())
  const [selectedDisease, setSelectedDisease] = useState<DiseaseId>('dengue')
  const [selectedFirstAid, setSelectedFirstAid] = useState<FirstAidId>('heat')
  const [completedHealthTasks, setCompletedHealthTasks] = useState<string[]>([])
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false)
  const [notificationEnabled, setNotificationEnabled] = useState(() =>
    window.localStorage.getItem(notificationEnabledStorageKey) === 'true' &&
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted')
  const [notificationTime, setNotificationTime] = useState(() => {
    const savedTime = window.localStorage.getItem(notificationTimeStorageKey)
    return morningNotificationTimes.find(time => time === savedTime) ?? '07:00'
  })
  const [notificationStatus, setNotificationStatus] = useState('')
  const t = (text: string, values: Record<string, string | number> = {}) =>
    Object.entries(values).reduce((translated, [key, value]) => translated.replaceAll(`{${key}}`, String(value)), translateText(language, text))

  useEffect(() => {
    document.documentElement.lang = language
    const pageTitles: Record<Language, string> = {
      ko: 'SDGs 11 | 하노이 지속가능 도시 & 스마트 외출 가이드',
      vi: 'SDGs 11 | Hà Nội bền vững & hướng dẫn ra ngoài an toàn',
      en: 'SDGs 11 | Hanoi sustainable city & smart outing guide',
    }
    document.title = pageTitles[language]
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', t('하노이의 날씨와 대기질을 확인하고 더 안전한 외출을 준비하세요.'))
  }, [language])

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage)
    window.localStorage.setItem('hanoi-app-language', nextLanguage)
    setNotificationStatus('')
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    const load = async () => {
      try {
        const [weatherResponse, airResponse] = await Promise.all([
          fetch('https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=Asia%2FBangkok'),
          fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=21.0285&longitude=105.8542&current=pm10,pm2_5,us_aqi&timezone=Asia%2FBangkok'),
        ])
        if (!weatherResponse.ok || !airResponse.ok) throw new Error('날씨 정보를 불러오지 못했습니다.')
        const [weatherJson, airJson] = await Promise.all([weatherResponse.json(), airResponse.json()])
        const current = weatherJson.current
        const currentHour = weatherJson.hourly.time.indexOf(current.time)
        const forecastStart = weatherJson.hourly.time.findIndex((time: string) => time >= current.time.slice(0, 13))
        const firstForecastHour = forecastStart < 0 ? Math.max(0, currentHour) : forecastStart
        const live: WeatherData = {
          temperature: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.apparent_temperature),
          humidity: current.relative_humidity_2m,
          rainChance: weatherJson.hourly.precipitation_probability[currentHour] ?? 0,
          rainfall: current.precipitation ?? 0,
          pm10: Math.round(airJson.current.pm10),
          pm25: Math.round(airJson.current.pm2_5),
          aqi: Math.round(airJson.current.us_aqi),
          wind: Math.round(current.wind_speed_10m),
          code: current.weather_code,
          updatedAt: current.time,
        }
        const hourly: HourlyForecast[] = weatherJson.hourly.time.slice(firstForecastHour, firstForecastHour + 24).map((time: string, index: number) => ({
          time,
          temperature: Math.round(weatherJson.hourly.temperature_2m[firstForecastHour + index]),
          feelsLike: Math.round(weatherJson.hourly.apparent_temperature[firstForecastHour + index]),
          rainChance: weatherJson.hourly.precipitation_probability[firstForecastHour + index] ?? 0,
          code: weatherJson.hourly.weather_code[firstForecastHour + index],
        }))
        const daily: DailyForecast[] = weatherJson.daily.time.slice(0, 7).map((date: string, index: number) => ({
          date,
          code: weatherJson.daily.weather_code[index],
          max: Math.round(weatherJson.daily.temperature_2m_max[index]),
          min: Math.round(weatherJson.daily.temperature_2m_min[index]),
          rainChance: weatherJson.daily.precipitation_probability_max[index] ?? 0,
        }))
        setWeather(live)
        setForecast({ hourly, daily })
      } catch (error) {
        console.error('하노이 날씨 데이터를 불러오지 못해 예시 데이터를 표시합니다.', error)
        setWeather({ ...sample, updatedAt: '' })
        setForecast(createSampleForecast())
        setUsingSample(true)
      }
    }
    void load()
    return () => window.clearInterval(timer)
  }, [])

  const current = useMemo<WeatherData>(() => {
    if (mode === 'rain') return { ...weather, temperature: 25, feelsLike: 27, humidity: 92, rainChance: 95, rainfall: 18, aqi: 83, code: 63 }
    if (mode === 'heat') return { ...weather, temperature: 37, feelsLike: 43, humidity: 62, rainChance: 5, rainfall: 0, aqi: 92, code: 0 }
    if (mode === 'clear') return { ...weather, temperature: 27, feelsLike: 28, humidity: 54, rainChance: 0, rainfall: 0, pm10: 25, pm25: 14, aqi: 38, code: 0 }
    return weather
  }, [weather, mode])

  const isRain = current.rainChance >= 70 || current.rainfall >= 10
  const isHeat = current.temperature >= 35
  const airBad = current.aqi > 100
  const weatherAlerts = [
    ...(current.temperature >= 35 || mode === 'heat' ? [{
      id: 'heat',
      title: '폭염 징후 감지 — 체감온도 상승과 온열질환 위험',
      cause: t('기온 {temperature}°C · 체감 {feelsLike}°C{simulation}', { temperature: current.temperature, feelsLike: current.feelsLike, simulation: mode === 'heat' ? ` · ${t('폭염 시뮬레이션')}` : '' }),
      severity: current.temperature >= 38 ? '위험' : '경계',
      actions: ['한낮 야외 활동과 격렬한 운동을 줄이고 그늘·냉방 공간에서 쉬세요.', '갈증이 나기 전부터 물을 조금씩 자주 마시고 동행자의 상태를 확인하세요.', '혼란·실신·뜨거운 피부 등 응급 징후가 있으면 즉시 115에 연락하세요.'],
    }] : []),
    ...(current.rainChance >= 60 || current.rainfall >= 10 || mode === 'rain' ? [{
      id: 'rain',
      title: '폭우·호우 징후 감지 — 강수와 돌발 침수 위험',
      cause: t('강수 확률 {rainChance}% · 현재 강수량 {rainfall} mm{simulation}', { rainChance: current.rainChance, rainfall: current.rainfall, simulation: mode === 'rain' ? ` · ${t('폭우 시뮬레이션')}` : '' }),
      severity: current.rainChance >= 80 || current.rainfall >= 20 ? '위험' : '경계',
      actions: ['저지대·지하차도·침수된 도로와 지하 공간 이동을 피하세요.', '안전한 실내에 머물고 필요하면 가까운 대피·휴식 거점으로 이동하세요.', '우산·방수 신발을 준비하되 물이 흐르는 도로는 건너지 말고 현지 안내를 따르세요.'],
    }] : []),
    ...(current.aqi >= 150 || current.pm25 >= 55.5 ? [{
      id: 'air',
      title: '고농도 미세먼지 징후 감지 — 호흡기 자극 주의',
      cause: t('US AQI {aqi} · PM2.5 {pm25} μg/m³', { aqi: current.aqi, pm25: current.pm25 }),
      severity: current.aqi >= 200 || current.pm25 >= 100 ? '위험' : '경계',
      actions: ['외출 시 얼굴에 밀착되는 KF94 등 보건용 마스크를 착용하세요.', '장시간 실외 체류와 격렬한 운동을 줄이고 창문을 닫아 공기청정기를 가동하세요.', '기침·호흡곤란 등 증상을 살피고 불편감이 지속되면 의료진과 상담하세요.'],
    }] : []),
  ] as const
  const weatherChecklists = [
    { id: 'rain', label: '폭우 대비', icon: CloudRain, tasks: ['대피 거점·이동 경로 확인', '저지대·지하차도 피하기'] },
    { id: 'heat', label: '폭염 대비', icon: Sun, tasks: ['물병 준비·수분 자주 보충', '한낮 야외 활동 줄이기'] },
    { id: 'air', label: '미세먼지 대비', icon: Wind, tasks: ['KF94 마스크 챙기기', '창문 닫고 공기청정기 확인'] },
  ]
  const toggleWeatherCheck = (task: string) => {
    setCompletedWeatherChecks(current => current.includes(task)
      ? current.filter(item => item !== task)
      : [...current, task])
  }
  const score = Math.max(12, Math.min(98,
    100 - (isRain ? 32 : current.rainChance >= 40 ? 12 : 0) - (isHeat ? 27 : current.temperature >= 32 ? 10 : 0) -
    (current.aqi > 150 ? 25 : current.aqi > 100 ? 16 : current.aqi > 50 ? 7 : 0) - (current.humidity > 85 ? 10 : 0)))
  const scoreLine = score >= 80 ? '가벼운 외출하기 좋은 날이에요' : score >= 60 ? '준비를 챙기면 외출할 수 있어요' : score >= 40 ? '실내 활동을 추천해요' : '꼭 필요한 외출만 해주세요'
  const filteredPlaces = places.filter(place => (area === '전체 보기' || place.area === area) && (category === '전체 장소' || place.category === category))
  const activePlace = filteredPlaces.find(place => place.name === selectedPlace) ?? filteredPlaces[0] ?? null
  const forecastMin = Math.min(...forecast.daily.map(day => day.min))
  const forecastMax = Math.max(...forecast.daily.map(day => day.max))
  const forecastRange = Math.max(forecastMax - forecastMin, 1)
  const next24Min = Math.min(...forecast.hourly.map(point => point.temperature))
  const next24Max = Math.max(...forecast.hourly.map(point => point.temperature))
  const peakRainHour = forecast.hourly.reduce((peak, point) => point.rainChance > peak.rainChance ? point : peak, forecast.hourly[0])
  const weekFirstHalf = forecast.daily.slice(0, 3).reduce((sum, day) => sum + day.max, 0) / Math.max(forecast.daily.slice(0, 3).length, 1)
  const weekSecondHalf = forecast.daily.slice(-3).reduce((sum, day) => sum + day.max, 0) / Math.max(forecast.daily.slice(-3).length, 1)
  const weeklyTrend = weekSecondHalf - weekFirstHalf > 1.5 ? '후반으로 갈수록 기온이 올라요' : weekSecondHalf - weekFirstHalf < -1.5 ? '주 후반에는 기온이 내려가요' : '이번 주 기온은 대체로 비슷해요'
  const weeklyRainDays = forecast.daily.filter(day => day.rainChance >= 40 || day.code >= 51).length
  const averageDailyRange = forecast.daily.reduce((sum, day) => sum + day.max - day.min, 0) / Math.max(forecast.daily.length, 1)
  const weeklyAdvice = `${t(weeklyTrend)}. ${weeklyRainDays ? t('{days}일은 우산을 챙기고', { days: weeklyRainDays }) : t('우산은 강수 변화를 확인해 준비하고')}, ${averageDailyRange >= 8 ? t('아침저녁 큰 일교차에 얇은 겉옷을 준비하세요.') : t('냉방 실내와 저녁에 대비해 얇은 겉옷을 챙기세요.')}`
  const timeWindows = [
    { label: t('오전 출근·등교'), start: 6, end: 10, center: 8 },
    { label: t('한낮 더위'), start: 11, end: 15, center: 13 },
    { label: t('저녁 퇴근·외출'), start: 17, end: 21, center: 19 },
  ].map(window => {
    const points = forecast.hourly.filter(point => {
      const hour = Number(point.time.slice(11, 13))
      return hour >= window.start && hour <= window.end
    })
    const nearest = forecast.hourly.reduce((best, point) =>
      Math.abs(Number(point.time.slice(11, 13)) - window.center) < Math.abs(Number(best.time.slice(11, 13)) - window.center) ? point : best,
    forecast.hourly[0])
    const temps = points.length ? points.map(point => point.temperature) : [nearest.temperature]
    const rain = points.length ? Math.max(...points.map(point => point.rainChance)) : nearest.rainChance
    const feels = points.length
      ? points.reduce((sum, point) => sum + point.feelsLike, 0) / points.length
      : nearest.feelsLike
    return { ...window, temperature: Math.round(temps.reduce((sum, value) => sum + value, 0) / temps.length), feelsLike: Math.round(feels), rainChance: rain }
  })
  const mask = current.aqi > 150 ? 'KF94 마스크 필수' : current.aqi > 100 ? '보건용 마스크 권장' : current.aqi > 50 ? '민감한 분은 마스크 권장' : '마스크 미착용 가능'
  const createWeatherNotification = (tag: string) => {
    const notification = new Notification(t('하노이 아침 날씨'), {
      body: t('기온 {temperature}°C · {weather}\nUS AQI {aqi} ({quality}) · {mask}', {
        temperature: current.temperature,
        weather: t(codeText(current.code)),
        aqi: current.aqi,
        quality: t(qualityText(current.aqi)),
        mask: t(mask),
      }),
      tag,
    })
    notification.onclick = () => window.focus()
    return notification
  }
  const sendTestNotification = async () => {
    if (typeof Notification === 'undefined') {
      setNotificationStatus(t('이 브라우저는 알림을 지원하지 않습니다.'))
      return
    }
    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()
    if (permission !== 'granted') {
      setNotificationStatus(permission === 'denied'
        ? t('브라우저 설정에서 알림 권한을 허용해 주세요.')
        : t('알림 권한을 허용하면 테스트를 보낼 수 있습니다.'))
      return
    }
    createWeatherNotification('hanoi-weather-test')
    setNotificationStatus(t('테스트 알림을 보냈습니다.'))
  }
  const toggleMorningNotifications = async () => {
    if (notificationEnabled) {
      setNotificationEnabled(false)
      window.localStorage.setItem(notificationEnabledStorageKey, 'false')
      setNotificationStatus(t('아침 알림을 껐습니다.'))
      return
    }
    if (typeof Notification === 'undefined') {
      setNotificationStatus(t('이 브라우저는 알림을 지원하지 않습니다.'))
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setNotificationEnabled(true)
      window.localStorage.setItem(notificationEnabledStorageKey, 'true')
      setNotificationStatus(t('아침 알림을 켰습니다.'))
    } else {
      setNotificationEnabled(false)
      window.localStorage.setItem(notificationEnabledStorageKey, 'false')
      setNotificationStatus(permission === 'denied'
        ? t('브라우저 설정에서 알림 권한을 허용해 주세요.')
        : t('알림 권한이 허용되지 않았습니다.'))
    }
  }

  useEffect(() => {
    if (!notificationEnabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const checkScheduledNotification = () => {
      const { date, time } = hanoiDateAndTime(new Date())
      const [hour, minute] = time.split(':').map(Number)
      const [scheduledHour, scheduledMinute] = notificationTime.split(':').map(Number)
      const minutesAfterSchedule = hour * 60 + minute - (scheduledHour * 60 + scheduledMinute)
      if (minutesAfterSchedule < 0 || minutesAfterSchedule > 60) return
      if (window.localStorage.getItem(notificationSentDateStorageKey) === date) return
      createWeatherNotification(`hanoi-weather-${date}`)
      window.localStorage.setItem(notificationSentDateStorageKey, date)
    }
    const timer = window.setInterval(checkScheduledNotification, 15_000)
    document.addEventListener('visibilitychange', checkScheduledNotification)
    checkScheduledNotification()
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', checkScheduledNotification)
    }
  }, [notificationEnabled, notificationTime, current.temperature, current.aqi, current.code, current.pm10, current.pm25, mask, language])

  useEffect(() => {
    if (!notificationSettingsOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotificationSettingsOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [notificationSettingsOpen])

  const saveNotificationTime = (time: typeof morningNotificationTimes[number]) => {
    setNotificationTime(time)
    window.localStorage.setItem(notificationTimeStorageKey, time)
    setNotificationStatus(t('알림 시각을 {time}으로 저장했습니다.', { time }))
  }
  const pm10Quality = pollutantQuality(current.pm10, 54, 154, 254)
  const pm25Quality = pollutantQuality(current.pm25, 9, 35.4, 55.4)
  const airAction = current.aqi > 150 || pm25Quality === '매우 나쁨' || pm10Quality === '매우 나쁨'
    ? 'KF94 등 보건용 마스크를 착용하고 실외 활동은 가능한 한 피하세요. 창문을 닫고 실내 공기청정기를 가동하며, 몸 상태를 살피고 물을 충분히 마시세요.'
    : current.aqi > 100 || pm25Quality === '나쁨' || pm10Quality === '나쁨'
      ? '외출 시 KF94 등 보건용 마스크를 권장해요. 장시간 실외 체류와 격렬한 운동은 줄이고, 실내에서는 공기청정기를 가동하세요.'
      : current.aqi > 50 || pm25Quality === '보통' || pm10Quality === '보통'
        ? '민감군은 장시간 야외 활동을 줄이고, 불편함이 있으면 보건용 마스크를 착용하세요. 실내 환기는 바깥 공기 상태를 확인해 조절하세요.'
        : '대기질이 양호해요. 평소처럼 활동하되, 호흡기 질환이 있다면 몸 상태를 살피고 물을 충분히 마셔 주세요.'
  const season = now.getMonth() >= 4 && now.getMonth() <= 9 ? '우기·고온다습' : '건기·일교차'
  const wetSeason = now.getMonth() >= 4 && now.getMonth() <= 9
  const winterSeason = now.getMonth() <= 1 || now.getMonth() >= 10
  const diseaseRisk: Record<DiseaseId, number> = {
    dengue: (wetSeason ? 1 : 0) + (current.humidity >= 80 ? 1 : 0) + (current.rainChance >= 70 || current.rainfall >= 10 ? 1 : 0) + (mode === 'rain' ? 1 : 0),
    respiratory: (current.aqi > 150 ? 2 : current.aqi > 100 ? 1 : 0) + (current.pm25 > 35 ? 1 : 0) + (current.humidity > 85 ? 1 : 0),
    flu: (winterSeason ? 2 : 1) + (current.aqi > 100 ? 1 : 0),
    waterborne: (current.humidity >= 80 ? 1 : 0) + (current.rainChance >= 70 || current.rainfall >= 10 ? 1 : 0) + (mode === 'rain' ? 1 : 0),
    heat: (current.temperature >= 35 ? 2 : current.temperature >= 32 ? 1 : 0) + (current.feelsLike >= 40 ? 1 : 0) + (mode === 'heat' ? 1 : 0),
  }
  const riskLevel = (id: DiseaseId): RiskLevel => {
    const score = diseaseRisk[id]
    return score >= 3 ? '높음' : score >= 2 ? '경계' : '주의'
  }
  const activeDisease = diseases.find(item => item.id === selectedDisease) ?? diseases[0]
  const priorityDisease = [...diseases].sort((a, b) => diseaseRisk[b.id] - diseaseRisk[a.id])[0]
  const priorityReasonKey = priorityDisease.id === 'respiratory'
    ? current.aqi > 100 || current.pm25 > 35
      ? 'AQI {aqi}, PM2.5 {pm25} μg/m³로 대기 오염물질이 호흡기 점막을 자극할 수 있어요.'
      : '습도 {humidity}%와 대기 상태 변화가 기침·천식 증상을 악화시킬 수 있어요.'
    : priorityDisease.id === 'dengue'
      ? '습도 {humidity}%{rain}로 모기 번식과 낮 시간 노출에 유의해야 해요.'
      : priorityDisease.id === 'heat'
        ? '기온 {temperature}°C, 체감 {feelsLike}°C로 땀 배출과 체온 조절이 어려울 수 있어요.'
        : priorityDisease.id === 'waterborne'
          ? '강수 확률 {rainChance}%와 습도 {humidity}%로 물·음식 위생에 더 신경 써야 해요.'
          : '건기·큰 일교차와 실내 밀집 환경이 호흡기 감염 전파 위험을 높일 수 있어요.'
  const priorityReason = t(priorityReasonKey, {
    aqi: current.aqi,
    pm25: current.pm25,
    humidity: current.humidity,
    rain: current.rainChance >= 70 || current.rainfall >= 10 ? t('강수 확률 {rainChance}%', { rainChance: current.rainChance }) : '',
    temperature: current.temperature,
    feelsLike: current.feelsLike,
    rainChance: current.rainChance,
  })
  const priorityAction: Record<DiseaseId, string> = {
    respiratory: '외출 시 KF94 마스크를 착용하고, 귀가 후 손·얼굴을 씻은 뒤 실내 공기청정기를 가동하세요.',
    dengue: '낮 외출 전 DEET·이카리딘 기피제를 사용하고 긴 옷을 입으세요. 고열이 나면 진료를 받으세요.',
    flu: '손을 30초 이상 씻고 혼잡한 실내에서는 마스크를 착용하세요.',
    waterborne: '밀봉 생수나 끓인 물만 마시고, 길거리 얼음과 덜 익힌 음식은 피하세요.',
    heat: '한낮 활동을 줄이고 그늘·냉방 공간에서 쉬며 물을 자주 마시세요.',
  }
  const toggleHealthTask = (task: string) => {
    setCompletedHealthTasks(currentTasks => currentTasks.includes(task)
      ? currentTasks.filter(item => item !== task)
      : [...currentTasks, task])
  }

  const modeButtons: { value: Mode; label: string }[] = [
    { value: 'clear', label: '맑음' }, { value: 'rain', label: '폭우' },
    { value: 'heat', label: '폭염' },
  ]
  const sections = [
    { id: 'forecast' as const, label: t('시간·주간 예보'), icon: CalendarDays, summary: t('오늘 강수 확률 {rainChance}% · 24시간 변화와 7일 예보를 확인하세요.', { rainChance: current.rainChance }) },
    { id: 'air' as const, label: t('대기질'), icon: Wind, summary: t('US AQI {aqi} · {quality} · {mask}.', { aqi: current.aqi, quality: t(qualityText(current.aqi)), mask: t(mask) }) },
    { id: 'outfit' as const, label: t('옷차림·준비물'), icon: Shirt, summary: t('오늘 날씨에 맞는 옷차림과 준비물을 확인하세요.') },
    { id: 'places' as const, label: t('안전 대피·한인 거점'), icon: MapPin, summary: t('{area}의 실내 거점을 확인하고, 폭우 시에는 당국 안내와 침수 정보를 우선하세요.', { area: area === '전체 보기' ? '하노이 한인 거주 권역' : t(area) }) },
    { id: 'health' as const, label: t('건강·질병 가이드'), icon: HeartPulse, summary: t('{season} · 오늘은 {diseases}에 유의하고 건강 체크리스트를 실천하세요.', { season: t(season), diseases: diseases.filter(item => riskLevel(item.id) === '높음').map(item => t(item.name)).join('·') || t('일상 예방 수칙') }) },
  ]

  return (
    <div className="app-shell">
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-identity">
            <strong className="header-brand-name">SDGs 11</strong>
          </div>
          <div className="topbar-right">
            <div className="mode-switch" role="group" aria-label={t('날씨 시뮬레이션')}>{modeButtons.map(button => <button key={button.value} className={mode === button.value ? 'selected' : ''} aria-pressed={mode === button.value} aria-label={t('{mode} 시뮬레이션, 다시 누르면 실시간 날씨로 돌아갑니다', { mode: t(button.label) })} onClick={() => setMode(mode === button.value ? 'live' : button.value)}>{t(button.label)}</button>)}</div>
            <button className={`notification-settings-trigger ${notificationEnabled ? 'is-enabled' : ''}`} type="button" aria-expanded={notificationSettingsOpen} aria-controls="notification-settings-dialog" onClick={() => setNotificationSettingsOpen(true)}>
              <Bell size={19} /><span>{t('아침 알림 설정')}</span><strong>{t(notificationEnabled ? '켜짐' : '꺼짐')}</strong>
            </button>
            <select className="language-select" aria-label={t('언어 선택')} value={language} onChange={event => {
              const nextLanguage = event.currentTarget.value
              if (nextLanguage === 'ko' || nextLanguage === 'vi' || nextLanguage === 'en') changeLanguage(nextLanguage)
            }}>
              <option value="ko">한국어</option>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
        </header>

        {notificationSettingsOpen && <div className="notification-dialog-backdrop" onClick={() => setNotificationSettingsOpen(false)}>
          <section className="notification-dialog" id="notification-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="notification-dialog-title" onClick={event => event.stopPropagation()}>
            <div className="notification-dialog-heading">
              <div className="notification-dialog-icon"><Bell size={22} /></div>
              <div><h2 id="notification-dialog-title">{t('아침 알림 설정')}</h2><p>{t('하노이 날씨와 대기질을 매일 알려드려요.')}</p></div>
              <button className="notification-dialog-close" type="button" aria-label={t('설정 창 닫기')} autoFocus onClick={() => setNotificationSettingsOpen(false)}><X size={21} /></button>
            </div>
            <div className="notification-setting-row">
              <div><strong>{t('아침 알림')}</strong><span>{t('브라우저 알림 권한이 필요합니다.')}</span></div>
              <button className={`notification-toggle ${notificationEnabled ? 'is-enabled' : ''}`} type="button" role="switch" aria-checked={notificationEnabled} onClick={() => void toggleMorningNotifications()}><span /><b>{t(notificationEnabled ? '켜짐' : '꺼짐')}</b></button>
            </div>
            <label className="notification-time-label" htmlFor="notification-time">{t('아침 알림 시각')}</label>
            <select id="notification-time" className="notification-time-select" value={notificationTime} onChange={event => {
              const time = morningNotificationTimes.find(option => option === event.currentTarget.value)
              if (time) saveNotificationTime(time)
            }}>
              {morningNotificationTimes.map(time => <option key={time} value={time}>{time}</option>)}
            </select>
            <p className="notification-schedule-note">{t('앱이 열려 있을 때 알림을 보냅니다. 시각이 지난 뒤 1시간 이내 다시 열면 한 번 알림을 보충합니다.')}</p>
            <button className="notification-test-button" type="button" onClick={() => void sendTestNotification()}><Bell size={18} /> {t('지금 테스트 알림 보내기')}</button>
            <p className="notification-status" role="status" aria-live="polite">{notificationStatus}</p>
          </section>
        </div>}

        <nav className="section-tabs" role="tablist" aria-label={t('앱 섹션')}>
          <button id="section-tab-home" type="button" role="tab" aria-selected={activeSection === 'home'} aria-controls="section-panel-home" className={activeSection === 'home' ? 'section-tab selected' : 'section-tab'} onClick={() => setActiveSection('home')}><Sun size={17} /><span>{t('메인')}</span></button>
          {sections.map(section => {
            const SectionIcon = section.icon
            return <button key={section.id} id={`section-tab-${section.id}`} type="button" role="tab" aria-selected={activeSection === section.id} aria-controls={`section-panel-${section.id}`} tabIndex={activeSection === section.id ? 0 : -1} className={activeSection === section.id ? 'section-tab selected' : 'section-tab'} onClick={() => setActiveSection(section.id)} onKeyDown={event => {
              if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              const currentIndex = sections.findIndex(item => item.id === section.id)
              const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? sections.length - 1 : (currentIndex + (event.key === 'ArrowRight' ? 1 : sections.length - 1)) % sections.length
              const next = sections[nextIndex]
              setActiveSection(next.id)
              document.getElementById(`section-tab-${next.id}`)?.focus()
            }}><SectionIcon size={17} /><span>{section.label}</span></button>
          })}
        </nav>

        <div className="page-wrap">
          <section className={`weather-alert-center ${weatherAlerts.length ? 'has-weather-alerts' : 'weather-all-clear'}`} aria-labelledby="weather-alert-heading">
            {weatherAlerts.length > 0 && <button className="compact-alert-banner" type="button" onClick={() => setActiveSection('forecast')}><ShieldAlert size={19} /><span>{t(weatherAlerts[0].title).split(' — ')[0]}</span><b>{t('자세히 보기')} <ArrowUpRight size={16} /></b></button>}
            <div className="weather-alert-center-heading">
              <div>
                <span className="weather-alert-kicker"><ShieldAlert size={16} /> {t('자동 기상·대기질 모니터링')}</span>
                <h2 id="weather-alert-heading">{weatherAlerts.length ? t('이상기후 공지 · {count}건', { count: weatherAlerts.length }) : t('현재 특별한 이상기후 징후가 없습니다')}</h2>
                <p>{weatherAlerts.length ? t('현재 하노이 조건과 선택한 시뮬레이션을 반영한 안내입니다.') : t('하노이 기온 {temperature}°C · 강수 {rainChance}% · AQI {aqi}. 현재 기상·대기질은 비교적 안정적입니다.', { temperature: current.temperature, rainChance: current.rainChance, aqi: current.aqi })}</p>
              </div>
              {weatherAlerts.length > 0 && <button className="weather-alert-toggle" type="button" aria-expanded={!alertsCollapsed} aria-controls="weather-alert-list" onClick={() => setAlertsCollapsed(collapsed => !collapsed)}>{t(alertsCollapsed ? '공지 펼치기' : '공지 접기')} <ChevronDown size={16} className={alertsCollapsed ? '' : 'chevron-open'} /></button>}
            </div>
            {weatherAlerts.length > 0 && !alertsCollapsed && <div className="weather-alert-list" id="weather-alert-list">
              {weatherAlerts.map(alert => (
                <article className={`weather-alert-card alert-${alert.id}`} key={alert.id}>
                  <div className="weather-alert-card-heading">
                    <div className="weather-alert-title"><ShieldAlert size={19} /><h3>{t(alert.title)}</h3></div>
                    <div className="weather-alert-meta"><span className={`severity-badge severity-${alert.severity}`}>{t(alert.severity)}</span><span>{t('하노이 {time} 발령', { time: new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : language === 'vi' ? 'vi-VN' : 'en-US', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false }).format(now) })}</span></div>
                  </div>
                  <p className="weather-alert-cause">{alert.cause}</p>
                  <ol className="weather-alert-actions">{alert.actions.map(action => <li key={action}>{t(action)}</li>)}</ol>
                  <button className="alert-shelter-link" type="button" onClick={() => setActiveSection('places')}>{t('안전 대피·한인 거점 탭으로 이동')} <ArrowUpRight size={16} /></button>
                </article>
              ))}
            </div>}
            <div className="weather-checklists">
              <div className="weather-checklist-heading"><strong>{t('이상기후 대비 행동 체크')}</strong><span>{t('필요한 준비를 눌러 완료 표시하세요.')}</span></div>
              <div className="weather-checklist-grid">{weatherChecklists.map(list => {
                const ChecklistIcon = list.icon
                return <article className={`weather-checklist checklist-${list.id}`} key={list.id}>
                  <h3><ChecklistIcon size={17} />{t(list.label)}</h3>
                  {list.tasks.map(task => {
                    const checked = completedWeatherChecks.includes(task)
                    return <button className={`weather-check-task ${checked ? 'weather-check-complete' : ''}`} type="button" role="checkbox" aria-checked={checked} key={task} onClick={() => toggleWeatherCheck(task)}><span>{checked && <Check size={12} />}</span>{t(task)}</button>
                  })}
                </article>
              })}</div>
            </div>
          </section>

          <section className="page-heading">
            <div><div className="eyebrow"><MapPin size={15} /> {t('하노이 · SDGs 11')}</div><h1>{activeSection === 'home' ? t('오늘의 하노이') : sections.find(section => section.id === activeSection)?.label}</h1><p>{now.toLocaleDateString(language === 'ko' ? 'ko-KR' : language === 'vi' ? 'vi-VN' : 'en-US', { timeZone: 'Asia/Bangkok', month: 'long', day: 'numeric', weekday: 'long' })}</p></div>
            {activeSection !== 'home' && <button className="back-home-button" type="button" onClick={() => setActiveSection('home')}>{t('← 메인으로 돌아가기')}</button>}
          </section>

          {activeSection !== 'home' && <div className="section-summary" role="note"><span>{t('핵심 요약')}</span><p>{sections.find(section => section.id === activeSection)?.summary}</p></div>}
          <div className="active-panel" role="tabpanel" id={`section-panel-${activeSection}`} aria-labelledby={`section-tab-${activeSection}`}>

          {activeSection === 'home' && <section className="dashboard-grid" aria-label={t('오늘의 핵심 요약')}>
            <article className="dashboard-card dashboard-weather">
              <div className="dashboard-card-top"><span className="dashboard-icon">{weatherIcon(current.code, 24)}</span><span className="dashboard-label">{t('현재 날씨 · 외출 점수')}</span></div>
              <div className="dashboard-weather-value"><strong>{current.temperature}°C</strong><span>{weatherIcon(current.code, 19)} {t(codeText(current.code))}</span></div>
              <div className="dashboard-score"><strong>{t('{score}점', { score })}</strong><span>{t(scoreLine)}</span></div>
              <button type="button" className="dashboard-link" onClick={() => setActiveSection('forecast')}>{t('자세히 보기')} <ArrowUpRight size={17} /></button>
            </article>
            <article className="dashboard-card dashboard-air">
              <div className="dashboard-card-top"><span className="dashboard-icon"><Wind size={23} /></span><span className="dashboard-label">{t('오늘의 대기질')}</span></div>
              <div className="dashboard-air-value"><strong>{current.aqi}</strong><span>AQI</span><b className={`quality-badge ${current.aqi > 100 ? 'bad' : current.aqi > 50 ? 'moderate' : ''}`}>{t(qualityText(current.aqi))}</b></div>
              <p className="dashboard-summary">{t(mask)}</p>
              <button type="button" className="dashboard-link" onClick={() => setActiveSection('air')}>{t('상세 기준 보기')} <ArrowUpRight size={17} /></button>
            </article>
            <article className="dashboard-card dashboard-outfit">
              <div className="dashboard-card-top"><span className="dashboard-icon"><Shirt size={23} /></span><span className="dashboard-label">{t('오늘의 옷차림 & 준비물')}</span></div>
              <h2>{t(current.temperature >= 33 ? '통기성 좋은 반팔' : current.temperature >= 28 ? '얇은 반팔과 가벼운 하의' : '얇은 긴팔과 가벼운 겉옷')}</h2>
              <div className="dashboard-essentials">
                {isRain && <span><Umbrella size={20} /> {t('우산')}</span>}
                <span><Droplets size={20} /> {t('물병')}</span>
                <span>{isHeat ? <Fan size={20} /> : <Sun size={20} />} {t(isHeat ? '손선풍기' : '선크림')}</span>
              </div>
              <button type="button" className="dashboard-link" onClick={() => setActiveSection('outfit')}>{t('전체 가이드')} <ArrowUpRight size={17} /></button>
            </article>
            <article className="dashboard-card dashboard-safety">
              <div className="dashboard-card-top"><span className="dashboard-icon"><ShieldAlert size={23} /></span><span className="dashboard-label">{t('안전 대피처 & 건강 주의보')}</span></div>
              <h2>{weatherAlerts.length ? t(weatherAlerts[0].title).split(' — ')[0] : `${t(priorityDisease.name)} ${t('주의')}`}</h2>
              <p className="dashboard-summary">{weatherAlerts.length ? t('기상 특보와 안전 행동을 확인하세요.') : `${t(priorityDisease.name)} ${t('예방 수칙을 확인하세요.')}`}</p>
              <button type="button" className="dashboard-link" onClick={() => setActiveSection('places')}>{t('대피 지도·예방법 보기')} <ArrowUpRight size={17} /></button>
            </article>
          </section>}

          {activeSection === 'home' && <>
          <section id="오늘" className="hero-grid">
            <div className={`weather-card ${isRain ? 'weather-rain' : isHeat ? 'weather-heat' : 'weather-clear'}`}>
                <div className="weather-card-top"><div><span className="card-overline">{t('현재 날씨')}</span><div className="weather-location"><MapPin size={15} /> {t('하노이, 베트남')} <ChevronDown size={14} /></div></div><div className="weather-date">{now.toLocaleDateString(language === 'ko' ? 'ko-KR' : language === 'vi' ? 'vi-VN' : 'en-US', { timeZone: 'Asia/Bangkok', month: 'long', day: 'numeric', weekday: 'long' })}</div></div>
                <div className="weather-main"><div><div className="temperature">{current.temperature}<span>°</span></div><div className="weather-description">{t(codeText(current.code))}</div><div className="feels-like">{t('체감 온도')} {current.feelsLike}°C</div></div><div className="weather-illustration">{weatherIcon(current.code, 62)}</div></div>
                <div className="weather-stats"><div><Droplets size={16} /><span>{t('습도')}</span><strong>{current.humidity}<small>%</small></strong></div><div><CloudRain size={16} /><span>{t('강수 확률')}</span><strong>{current.rainChance}<small>%</small></strong></div><div><Wind size={16} /><span>{t('바람')}</span><strong>{current.wind}<small> km/h</small></strong></div></div>
                <div className="weather-foot"><span><i /> {mode === 'live' ? (usingSample ? t('예시 데이터') : t('실시간 업데이트')) : t('시뮬레이션 모드')}</span><span>{weather.updatedAt ? `${t('기준')} ${weather.updatedAt.slice(11, 16)}` : t('하노이 현지 기준')}</span></div>
            </div>

            <div className="score-card"><div className="score-top"><div><span className="card-overline">{t('오늘의 외출 컨디션')}</span><h2>{t('외출 적합도')}</h2></div><div className="score-icon"><Activity size={18} /></div></div><div className="score-display"><div className="score-ring" style={{ '--score': `${score}%`, '--score-color': score >= 70 ? '#0f766e' : score >= 40 ? '#c17b16' : '#c64b48' } as React.CSSProperties}><div><strong>{score}</strong><span>{t('점')}</span></div></div><div className="score-caption"><strong>{t(scoreLine)}</strong><span>{t(score >= 70 ? '준비만 잘하면 기분 좋은 외출!' : '오늘의 날씨에 맞춰 안전하게 준비해요.')}</span></div></div><div className="score-divider" /><div className="score-factors"><div><span className={isRain ? 'factor-warn' : ''}><CloudRain size={14} /> {t('강수')}</span><b>{t(isRain ? '주의' : current.rainChance > 30 ? '보통' : '좋음')}</b></div><div><span className={isHeat ? 'factor-warn' : ''}><Sun size={14} /> {t('기온')}</span><b>{t(isHeat ? '폭염' : current.temperature > 31 ? '더움' : '쾌적')}</b></div><div><span className={airBad ? 'factor-warn' : ''}><Wind size={14} /> {t('공기')}</span><b>{t(qualityText(current.aqi))}</b></div></div><div className="score-tip"><BadgeCheck size={14} /> {t(score < 60 ? '무리한 야외 활동보다 가까운 실내 장소를 추천해요.' : '물과 자외선 차단제를 챙기면 더 좋아요.')}</div></div>
            <div className="brief-outfit">
              <div className="brief-outfit-heading"><div className="brief-icon"><Shirt size={17} /></div><div><span className="card-overline">{t('외출 준비 요약')}</span><h2>{t('오늘의 옷차림')}</h2></div></div>
              <p>{t(current.temperature >= 33 ? '통기성 좋은 반팔과 가벼운 면바지' : current.temperature >= 28 ? '얇은 반팔과 통풍이 잘되는 하의' : '얇은 긴팔 셔츠와 가벼운 겉옷')}</p>
              <div className="brief-outfit-detail"><div><Shield size={15} /><span>{t('마스크')}</span><b>{t(mask)}</b></div><div>{isRain ? <Umbrella size={15} /> : <Droplets size={15} />}<span>{t('준비물')}</span><b>{t(isRain ? '우산 · 방수 겉옷' : isHeat ? '물 · 선크림 · 손선풍기' : '물 · 선크림')}</b></div></div>
              <a href="#옷차림">{t('준비물 자세히 보기')} <ArrowUpRight size={14} /></a>
            </div>
          </section>

          </>}

          {activeSection === 'forecast' && <section className="section-block forecast-section">
            <div className="section-heading"><div><div className="eyebrow">{t('날씨 예보')}</div><h2>{t('하노이 날씨 예보')}</h2><p>{t('시간대별 변화와 앞으로의 한 주 날씨를 미리 확인하세요.')}</p></div><span className="place-count"><CloudSun size={14} /> {t('7일 예보')}</span></div>
            <article className="forecast-brief-card">
              <div className="forecast-brief-title"><span className="forecast-brief-icon"><CloudSun size={20} /></span><div><span>{t('하루 계획을 위한 핵심 정보')}</span><h3>{t('24시간 & 주간 날씨 요약 브리핑')}</h3></div></div>
              <div className="forecast-brief-stats">
                <div><span>{t('24시간 최저')}</span><strong>{next24Min}°C</strong></div>
                <div><span>{t('24시간 최고')}</span><strong>{next24Max}°C</strong></div>
                <div><span>{t('최대 강수 시간')}</span><strong>{peakRainHour.rainChance ? `${forecastTime(peakRainHour.time, language)} · ${peakRainHour.rainChance}%` : t('비 소식 적음')}</strong></div>
                <div><span>{t('주간 기온 흐름')}</span><strong>{t(weeklyTrend)}</strong></div>
              </div>
              <p className="forecast-brief-advice"><Umbrella size={16} />{weeklyAdvice}</p>
            </article>
            <div className="forecast-card hourly-card">
              <div className="forecast-card-heading"><div><strong>{t('향후 24시간 예보 그래프')}</strong><span>{t('기온 곡선과 시간대별 강수 막대를 함께 확인하세요.')}</span></div><span className="forecast-updated">{t(mode === 'live' && !usingSample ? '실시간 예보' : '하노이 예시 예보')}</span></div>
              <HourlyChart points={forecast.hourly} language={language} />
            </div>
            <div className="time-window-card">
              <div className="time-window-heading"><strong>{t('시간대별 체감 포인트')}</strong><span>{t('출근·한낮·퇴근 시간 계획에 참고하세요.')}</span></div>
              <div className="time-window-grid">{timeWindows.map(window => (
                <article className={`time-window-chip ${window.rainChance >= 50 ? 'time-window-rain' : window.feelsLike >= 34 ? 'time-window-warm' : ''}`} key={window.label}>
                  <span className="time-window-label">{window.label} <small>{String(window.start).padStart(2, '0')}–{String(window.end).padStart(2, '0')}{language === 'ko' ? '시' : 'h'}</small></span>
                  <strong>{window.temperature}°C <small>{t('체감 온도')} {window.feelsLike}°C</small></strong>
                  <span className="time-window-rain-chance"><CloudRain size={14} /> {t('강수 최대 {rainChance}%', { rainChance: window.rainChance })}</span>
                </article>
              ))}</div>
            </div>
            <div className="forecast-card daily-card">
              <div className="forecast-card-heading"><div><strong>{t('7일 주간 예보')}</strong><span>{t('이번 주 기온 범위와 비 소식을 확인해요.')}</span></div><div className="temp-range-key"><i /> {t('최저 · 최고 기온')}</div></div>
              <div className="daily-forecast-grid">{forecast.daily.map((day, index) => <article className="daily-forecast" key={day.date}>
                <span className="daily-weekday">{index === 0 ? t('오늘') : forecastDay(day.date, language)}</span>
                <span className="daily-date">{day.date.slice(5).replace('-', '.')}</span>
                <span className={`daily-weather-icon ${day.rainChance >= 50 ? 'rainy' : ''}`}>{weatherIcon(day.code)}</span>
                <span className="daily-rain"><CloudRain size={12} /> {day.rainChance}%</span>
                <div className="daily-temperatures"><span>{day.min}°</span><div className="daily-range-track"><i style={{ left: `${((day.min - forecastMin) / forecastRange) * 100}%`, width: `${Math.max(8, ((day.max - day.min) / forecastRange) * 100)}%` }} /></div><b>{day.max}°</b></div>
                <span className="daily-weather-note">{t(dayWeatherNote(day))}</span>
              </article>)}</div>
              <div className="daily-range-labels"><span>{forecastMin}°C</span><span>{forecastMax}°C</span></div>
            </div>
          </section>
          }

          {activeSection === 'air' && <>
          <section id="대기질" className="section-block"><div className="section-heading"><div><div className="eyebrow">{t('대기 환경')}</div><h2>{t('오늘의 공기 상태')} <span className={`quality-badge ${current.aqi > 100 ? 'bad' : current.aqi > 50 ? 'moderate' : ''}`}>{t(qualityText(current.aqi))}</span></h2><p>{t('하노이의 대기질을 확인하고 호흡기를 보호해요.')}</p></div><button className="text-button" type="button" aria-expanded={airDetailsOpen} aria-controls="air-quality-details" onClick={() => setAirDetailsOpen(open => !open)}>{t(airDetailsOpen ? '상세 정보 접기' : '상세 정보')} <ArrowUpRight size={15} /></button></div>
            <div className="air-grid"><div className={`air-card aqi-card air-grade-${qualityText(current.aqi).replace(' ', '-')}`}><div className="air-card-heading"><div className="metric-icon purple"><Activity size={17} /></div><span>{t('미국 통합 대기질 지수')}</span><button className="info-dot" type="button" aria-label={t('대기질 등급과 행동 요령 자세히 보기')} aria-expanded={airDetailsOpen} aria-controls="air-quality-details" onClick={() => setAirDetailsOpen(open => !open)}>i</button></div><div className="aqi-line"><strong>{current.aqi}</strong><span>AQI</span><div className={`aqi-label air-grade-${qualityText(current.aqi).replace(' ', '-')}`}><i />{t(qualityText(current.aqi))}</div></div><div className="aqi-scale"><span style={{ left: `${Math.min(100, (current.aqi / 300) * 100)}%` }} /></div><div className="aqi-scale-labels"><span>{t('좋음')}</span><span>{t('보통')}</span><span>{t('나쁨')}</span><span>{t('매우 나쁨')}</span></div></div><div className={`air-card pollutant-card air-grade-${pm10Quality.replace(' ', '-')}`}><div className="air-card-heading"><div className="metric-icon mint"><Wind size={17} /></div><span>{t('미세먼지 · PM10')}</span></div><div className="pollutant-reading">{current.pm10}<small> μg/m³</small></div><div className="pollutant-bottom"><span>{t('미국 AQI 등급 기준')}</span><span className={`mini-good air-grade-${pm10Quality.replace(' ', '-')}`}>{t(pm10Quality)}</span></div><div className="mini-progress"><i style={{ width: `${Math.min(100, (current.pm10 / 300) * 100)}%` }} /></div></div><div className={`air-card pollutant-card air-grade-${pm25Quality.replace(' ', '-')}`}><div className="air-card-heading"><div className="metric-icon blue"><Wind size={17} /></div><span>{t('초미세먼지 · PM2.5')}</span></div><div className="pollutant-reading">{current.pm25}<small> μg/m³</small></div><div className="pollutant-bottom"><span>{t('미국 AQI 등급 기준')}</span><span className={`mini-good air-grade-${pm25Quality.replace(' ', '-')}`}>{t(pm25Quality)}</span></div><div className="mini-progress"><i className="blue-bar" style={{ width: `${Math.min(100, (current.pm25 / 100) * 100)}%` }} /></div></div></div>
            {airDetailsOpen && <div className="air-details-panel" id="air-quality-details">
              <div className="air-details-heading"><div><span className="eyebrow">{t('측정값 안내')}</span><h3>{t('대기질 등급과 오늘의 행동 요령')}</h3></div><span className="air-live-reading">AQI {current.aqi} {t(qualityText(current.aqi))} · PM10 {current.pm10} ({t(pm10Quality)}) · PM2.5 {current.pm25} ({t(pm25Quality)})</span></div>
              <p className="air-action"><ShieldAlert size={17} /><span>{t(airAction)}</span></p>
              <div className="air-table-wrap"><table className="air-ranges-table"><thead><tr><th>{t('등급')}</th><th>US AQI</th><th>PM10 (μg/m³)</th><th>PM2.5 (μg/m³)</th></tr></thead><tbody>
                {airQualityRanges.map(range => <tr key={range.label} className={qualityText(current.aqi) === range.label ? 'current-air-range' : ''}><th scope="row">{t(range.label)}</th><td>{range.aqi}</td><td>{range.pm10}</td><td>{range.pm25}</td></tr>)}
              </tbody></table></div>
              <p className="air-data-source">{t('하노이 실시간 대기질 데이터: Open-Meteo Air Quality API (US AQI, PM10, PM2.5). 등급 구간은 미국 EPA AQI 기준을 간단히 묶어 안내합니다.')}</p>
            </div>}
          </section>
          </>}

          {activeSection === 'outfit' && <>
          <section id="옷차림" className="section-block"><div className="section-heading"><div><div className="eyebrow">{t('외출 준비')}</div><h2>{t('오늘의 외출 준비')}</h2><p>{t('현재 날씨에 꼭 맞는 옷차림과 준비물을 챙겨요.')}</p></div><div className="recommend-tag"><BadgeCheck size={15} /> {t('맞춤 추천')}</div></div>
            <div className="prep-grid"><div className="prep-card outfit-card"><div className="prep-title"><div className="prep-icon lavender"><Sun size={18} /></div><div><strong>{t('오늘의 옷차림')}</strong><span>{t('기온 {temperature}°C · 습도 {humidity}% 기준', { temperature: current.temperature, humidity: current.humidity })}</span></div></div><div className="outfit-row"><span className="outfit-icon"><Shirt size={16} /></span><div><b>{t('상의')}</b><span>{t(current.temperature >= 33 ? '통기성 좋은 반팔 면 티셔츠' : current.temperature >= 28 ? '얇은 반팔 · 가벼운 블라우스' : '얇은 긴팔 셔츠 · 가디건')}</span></div><Check size={15} /></div><div className="outfit-row"><span className="outfit-icon"><Footprints size={16} /></span><div><b>{t('하의')}</b><span>{t(current.humidity > 80 ? '통풍이 잘되는 얇은 면바지' : '가벼운 면바지 · 편한 스커트')}</span></div><Check size={15} /></div><div className="outfit-row"><span className="outfit-icon"><CloudSun size={16} /></span><div><b>{t('겉옷')}</b><span>{t(isRain ? '작은 우산 또는 방수 재킷' : current.temperature > 32 ? '실내 냉방 대비 얇은 가디건' : '필요 시 얇은 겉옷')}</span></div><Check size={15} /></div><div className={`mask-note ${airBad ? 'mask-alert' : ''}`}><div className="mask-symbol"><Shield size={16} /></div><div><b>{t('마스크 착용')}</b><span>{t(mask)}</span></div><span className="mask-status">{t(current.aqi > 100 ? '권장' : '선택')}</span></div></div>
              <div className="prep-card essentials-card"><div className="prep-title"><div className="prep-icon peach"><ShoppingBag size={17} /></div><div><strong>{t('꼭 챙겨요')}</strong><span>{t('오늘의 필수 휴대품')}</span></div></div><div className="essential-list"><div className={isRain ? 'essential-active' : ''}><span><Umbrella size={16} /></span><b>{t('접이식 우산')}</b><small>{t(isRain ? '필수' : current.rainChance >= 30 ? '챙기면 좋아요' : '선택')}</small></div><div><span><Sun size={16} /></span><b>{t('선크림')}</b><small>{t('SPF 30 이상')}</small></div><div className={isHeat ? 'essential-active' : ''}><span><Fan size={16} /></span><b>{t('손선풍기')}</b><small>{t(isHeat ? '필수' : '더울 때 유용해요')}</small></div><div><span><Droplets size={16} /></span><b>{t('물병')}</b><small>{t('수분 보충')}</small></div></div><div className="essentials-tip"><BadgeCheck size={13} /> {t(isHeat ? '한낮에는 그늘에서 자주 쉬어 주세요.' : isRain ? '비가 많이 올 때는 지하도와 저지대를 피하세요.' : '자외선이 강한 날엔 선크림을 덧발라 주세요.')}</div></div></div>
          </section>
          </>}

          {activeSection === 'places' && <section id="안전한장소" className="section-block places-section">
            <div className="section-heading">
            <div><div className="eyebrow">{t('이상기후 대피 · 휴식')}</div><h2>{t('한인 거주 지역 안전 거점')}</h2><p>{t('권역별 실내 대피·휴식 장소와 위치를 확인하세요.')}</p></div>
            <button className="text-button" type="button" onClick={() => setActiveSection('health')}>{t('질병별 예방법·응급처치 보기')} <ArrowUpRight size={16} /></button>
            </div>
            <div className="filters">
              <div className="area-filters" role="group" aria-label={t('한인 거주 권역 선택')}>
                {areas.map(item => <button aria-pressed={area === item} className={area === item ? 'filter-active' : ''} key={item} onClick={() => setArea(item)}>{t(item)}</button>)}
              </div>
              <div className="category-select"><select value={category} onChange={event => setCategory(event.target.value)} aria-label={t('장소 유형 선택')}><option value="전체 장소">{t('전체 장소')}</option><option value="쇼핑몰">{t('쇼핑몰')}</option><option value="복합시설">{t('복합시설')}</option><option value="상가·커뮤니티">{t('상가·커뮤니티')}</option></select><ChevronDown size={14} /></div>
            </div>
            <p className="place-safety-note">{t('아래는 공식 지정 대피소가 아닌 실내 거점 후보입니다. 운영시간·한국어 응대·공기 여과 여부를 방문 전 확인하고, 폭우 시 지하공간과 침수 우려 지역을 피하며 현장·당국 안내를 우선하세요.')}</p>
            <div className="place-explorer">
              <div>
                <div className="places-grid">
                  {filteredPlaces.map(item => {
                    const PlaceIcon = item.icon
                    return (
                      <article className={`place-card ${activePlace?.name === item.name ? 'place-card-selected' : ''}`} key={item.name}>
                        <div className="place-card-heading">
                          <div className="place-art"><PlaceIcon size={18} /></div>
                          <div className="place-meta"><span><MapPin size={12} /> {t(item.area)}</span><span>{t(item.category)}</span></div>
                        </div>
                        <h3>{t(item.name)}</h3>
                        <details className="place-details">
                          <summary>{t('장소 정보 자세히 보기')}</summary>
                          <p className="place-description">{t(item.detail)}</p>
                          <div className="place-resident-access"><strong>{t('한인 거주지 인접')}</strong><span>{t(item.residentAccess)}</span></div>
                          <div className="place-recommendations">
                            {item.recommendations.map(recommendation => <p key={recommendation}>{t(recommendation)}</p>)}
                          </div>
                        </details>
                        <div className="place-card-footer">
                          <div className="place-hours"><Clock3 size={13} /><span>{t(item.hours)}</span></div>
                          <div className="place-actions">
                            <button className="place-select" type="button" aria-pressed={activePlace?.name === item.name} onClick={() => setSelectedPlace(item.name)}><MapPin size={13} /> {t('지도에서 보기')}</button>
                            <a className="place-map-link" href={item.googleMapsUrl} target="_blank" rel="noopener noreferrer">{t('구글 지도 앱/웹으로 길찾기')} <ArrowUpRight size={14} /></a>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
                {filteredPlaces.length === 0 && <div className="empty-state">{t('조건에 맞는 장소가 없어요. 다른 필터를 선택해 주세요.')}</div>}
              </div>
              <aside className="place-map-panel">
                {activePlace ? (
                  <>
                    <div className="place-map-heading"><div><span>{t('선택한 안전 거점')}</span><strong>{t(activePlace.name)}</strong><small>{t(activePlace.area)}</small></div><MapPin size={17} /></div>
                    <iframe
                      className="place-map-frame"
                      key={activePlace.name}
                      src={activePlace.mapEmbedUrl}
                      title={`${t(activePlace.name)} ${t('구글 지도')}`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <a className="map-directions-link" href={activePlace.googleMapsUrl} target="_blank" rel="noopener noreferrer">{t('구글 지도에서 길찾기')} <ArrowUpRight size={14} /></a>
                  </>
                ) : <div className="empty-state">{t('지도에 표시할 거점이 없습니다.')}</div>}
              </aside>
            </div>
          </section>
          }

          {activeSection === 'health' && <section id="건강가이드" className="section-block health-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">{t('계절 건강 안내')}</div>
                <h2>{t('하노이 건강 가이드')} <span className="season-chip"><Moon size={12} /> {t(season)}</span></h2>
                <p>{t('오늘의 날씨와 대기질을 반영한 질환별 예방 안내예요.')}</p>
              </div>
              <span className="health-mark"><HeartPulse size={18} /></span>
            </div>
            <section className={`health-briefing risk-${riskLevel(priorityDisease.id)}`} aria-labelledby="health-briefing-title">
              <div className="health-briefing-top">
                <div>
                  <span className="health-briefing-kicker"><Activity size={15} /> {t('오늘의 맞춤 건강 브리핑')}</span>
                  <h3 id="health-briefing-title">{t('오늘 주의 1순위 · {disease}', { disease: t(priorityDisease.name) })}</h3>
                </div>
                <span className={`risk-badge risk-${riskLevel(priorityDisease.id)}`}>{t('{level} 단계', { level: t(riskLevel(priorityDisease.id)) })}</span>
              </div>
              <p className="health-briefing-reason">{priorityReason}</p>
              <div className="health-briefing-metrics">
                <span>{current.temperature}°C</span><span>{t('습도')} {current.humidity}%</span><span>AQI {current.aqi}</span><span>PM10 {current.pm10}</span><span>PM2.5 {current.pm25}</span><span>{t(mode === 'live' ? '실시간' : '{mode} 모드', { mode: t(modeButtons.find(item => item.value === mode)?.label ?? '') })}</span>
              </div>
              <p className="health-briefing-action"><Shield size={16} />{priorityAction[priorityDisease.id]}</p>
            </section>
            <section className="first-aid-section" aria-labelledby="first-aid-title">
              <div className="first-aid-heading">
                <div><span className="eyebrow"><HeartPulse size={14} /> {t('바로 쓰는 안전 안내')}</span><h3 id="first-aid-title">{t('응급처치 가이드')}</h3><p>{t('전문 의료진이 도착하기 전, 안전을 확보하고 초기 대응을 시작하세요.')}</p></div>
                <span className="first-aid-callout"><span>{t('베트남 구급차')}</span><strong>115</strong></span>
              </div>
              <div className="cpr-card">
                <div className="cpr-card-heading"><span className="cpr-icon"><HeartPulse size={21} /></span><div><span>{t('성인 기본 안내')}</span><h4>{t('심폐소생술(CPR) & AED')}</h4></div></div>
                <ol className="cpr-steps">
                  <li><span>1</span><div><strong>{t('현장 안전·도움 요청')}</strong><p>{t('주변 위험을 확인하고 반응이 없으면 큰 소리로 도움을 요청하세요. 한 사람은 115에 신고하고 다른 사람은 AED를 가져오도록 합니다.')}</p></div></li>
                  <li><span>2</span><div><strong>{t('반응과 정상 호흡 확인')}</strong><p>{t('어깨를 가볍게 두드려 반응을 확인하고, 정상 호흡이 없거나 헐떡임만 있으면 심정지로 보고 즉시 CPR을 시작하세요. 맥박 확인으로 지체하지 마세요.')}</p></div></li>
                  <li><span>3</span><div><strong>{t('가슴 압박 시작')}</strong><p>{t('단단한 바닥에 눕히고 가슴 중앙, 흉골 아래쪽 절반에 손꿈치를 놓습니다. 분당 100–120회, 성인 약 5cm 깊이로 강하고 빠르게 누른 뒤 매번 가슴이 완전히 올라오게 합니다.')}</p></div></li>
                  <li><span>4</span><div><strong>{t('중단을 최소화')}</strong><p>{t('도움이 올 때까지 계속 압박하세요. 훈련을 받았고 할 수 있다면 30회 압박과 2회 인공호흡을 시행하고, 그렇지 않다면 가슴 압박만 계속하며 115 신고자의 안내를 따르세요.')}</p></div></li>
                </ol>
                <div className="aed-steps">
                  <h5><Activity size={16} /> {t('AED가 도착하면')}</h5>
                  <p><b>{t('전원 켜기')}</b><span>→</span><b>{t('맨가슴에 패드 부착')}</b><span>→</span><b>{t('분석 중 모두 떨어지기')}</b><span>→</span><b>{t('안내 시 충격 시행')}</b><span>→</span><b>{t('즉시 압박 재개')}</b></p>
                  <small>{t('충격 버튼을 누르기 전 주변 사람이 환자에게 닿지 않았는지 확인하세요. AED 음성 안내를 따르고 구급대가 인계할 때까지 CPR을 이어갑니다.')}</small>
                </div>
              </div>
              <div className="first-aid-situations">
                <h4>{t('상황별 응급처치')}</h4>
                <div className="first-aid-tabs" role="tablist" aria-label={t('상황별 응급처치 선택')}>
                  {firstAidGuides.map(guide => {
                    const GuideIcon = guide.icon
                    return <button key={guide.id} id={`first-aid-tab-${guide.id}`} type="button" role="tab" aria-selected={selectedFirstAid === guide.id} aria-controls="first-aid-panel" className={selectedFirstAid === guide.id ? 'first-aid-tab selected' : 'first-aid-tab'} onClick={() => setSelectedFirstAid(guide.id)}><GuideIcon size={17} /><span>{t(guide.title)}</span></button>
                  })}
                </div>
                {firstAidGuides.filter(guide => guide.id === selectedFirstAid).map(guide => (
                  <article className={`first-aid-detail first-aid-${guide.id}`} id="first-aid-panel" role="tabpanel" aria-labelledby={`first-aid-tab-${guide.id}`} key={guide.id}>
                    <h5>{t('{title} · 초기 대응', { title: t(guide.title) })}</h5>
                    <ol>{guide.steps.map(step => <li key={step}>{t(step)}</li>)}</ol>
                    <div className="first-aid-avoid"><strong>{t('하지 말아야 할 행동')}</strong><ul>{guide.avoid.map(item => <li key={item}>{t(item)}</li>)}</ul></div>
                    {guide.emergency && <p className="first-aid-emergency"><ShieldAlert size={15} />{t(guide.emergency)}</p>}
                  </article>
                ))}
              </div>
              <p className="first-aid-disclaimer"><ShieldAlert size={15} /> {t('응급처치는 전문 의료진이 도착하기 전까지의 초기 대응입니다. 의식 없음·정상 호흡 없음·호흡 곤란·심한 통증·지속 출혈 등 위급 징후가 있으면 즉시 베트남 응급번호 115에 신고하고, 전화 안내를 따르세요. 본 안내는 교육용 요약이며 CPR/AED 실습 교육을 대체하지 않습니다.')}</p>
            </section>
            <h3 className="health-guides-title">{t('질환별 상세 가이드')} <span>{t('선택해 증상과 단계별 예방 수칙을 확인하세요')}</span></h3>
            <div className="health-grid" role="tablist" aria-label={t('질병별 건강 가이드')}>
              {diseases.map(item => {
                const level = riskLevel(item.id)
                const DiseaseIcon = item.icon
                return (
                  <button
                    className={`health-card ${selectedDisease === item.id ? 'health-card-selected' : ''}`}
                    key={item.id}
                    id={`health-tab-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selectedDisease === item.id}
                    aria-controls="health-detail-panel"
                    tabIndex={selectedDisease === item.id ? 0 : -1}
                    onClick={() => setSelectedDisease(item.id)}
                    onKeyDown={event => {
                      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
                      event.preventDefault()
                      const currentIndex = diseases.findIndex(disease => disease.id === item.id)
                      const direction = event.key === 'ArrowRight' ? 1 : -1
                      const next = diseases[(currentIndex + direction + diseases.length) % diseases.length]
                      setSelectedDisease(next.id)
                      document.getElementById(`health-tab-${next.id}`)?.focus()
                    }}
                  >
                    <span className="disease-icon"><DiseaseIcon size={16} /></span>
                    <span className="health-card-copy">
                      <span className="disease-season">{t(item.id === 'heat' ? '기후별 추가 가이드' : '주요 질환')} · {t('오늘의 위험도')}</span>
                      <span className="health-card-title">{t(item.name)}</span>
                      <span className="health-card-description">{t(item.text)}</span>
                    </span>
                    <span className={`risk-badge risk-${level}`}>{t(level)}</span>
                  </button>
                )
              })}
            </div>
            <div className="health-content-grid">
              <article
                className="disease-detail"
                id="health-detail-panel"
                role="tabpanel"
                aria-labelledby={`health-tab-${activeDisease.id}`}
              >
                <div className="detail-heading">
                  <div>
                    <span className="detail-overline">{t('질병별 예방 가이드')}</span>
                    <h3>{t(activeDisease.name)}</h3>
                  </div>
                  <span className={`risk-badge risk-${riskLevel(activeDisease.id)}`}>{t('오늘 {level}', { level: t(riskLevel(activeDisease.id)) })}</span>
                </div>
                <details className="disease-background">
                  <summary><h4><MapPin size={15} /> {t('하노이 발생 배경·위험 요인')}</h4></summary>
                  <p>{t(activeDisease.background)}</p>
                </details>
                <details className="detail-block disease-symptoms">
                  <summary><h4>{t('주요 초기 의심 증상')}</h4></summary>
                  <ul className="symptom-list">{activeDisease.symptoms.map(symptom => <li key={symptom}>{t(symptom)}</li>)}</ul>
                </details>
                <details className="disease-prevention">
                  <summary><h4>{t('단계별 예방 수칙')}</h4></summary>
                  <div className="prevention-stages">
                    {activeDisease.preventionStages.map((stage, index) => (
                      <article className={`prevention-stage prevention-stage-${index + 1}`} key={stage.label}>
                        <h5><span>{index + 1}</span>{t(stage.label)}</h5>
                        <ul>{stage.steps.map(step => <li key={step}><Check size={15} />{t(step)}</li>)}</ul>
                      </article>
                    ))}
                  </div>
                </details>
                <details className={`local-advice ${activeDisease.id === 'dengue' ? 'dengue-advice' : ''}`}>
                  <summary className="local-advice-title"><ShieldAlert size={15} /> {t('현지 대처·복약 및 진료 주의')}</summary>
                  <p>{t(activeDisease.localAdvice)}</p>
                </details>
              </article>
              <aside className="daily-health-card">
                <div className="daily-health-heading">
                  <span className="daily-health-icon"><Check size={15} /></span>
                  <div><h3>{t('오늘의 건강 실천')}</h3><span>{t('{completed}/{total} 완료', { completed: completedHealthTasks.length, total: dailyHealthTasks.length })}</span></div>
                </div>
                <div className="daily-health-list">
                  {dailyHealthTasks.map(task => {
                    const checked = completedHealthTasks.includes(task)
                    return (
                      <button
                        className={`daily-health-task ${checked ? 'task-complete' : ''}`}
                        key={task}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => toggleHealthTask(task)}
                      >
                        <span className="task-checkbox">{checked && <Check size={12} />}</span>
                        <span>{t(task)}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="health-progress"><span style={{ width: `${(completedHealthTasks.length / dailyHealthTasks.length) * 100}%` }} /></div>
              </aside>
            </div>
            <section className="hospital-reference" aria-labelledby="hospital-reference-title">
              <div className="hospital-reference-heading">
                <div><span className="eyebrow">{t('현지 진료 참고')}</span><h3 id="hospital-reference-title">{t('하노이 의료기관·응급 연락 안내')}</h3></div>
                <span className="emergency-number"><span>{t('응급 의료')}</span><strong>115</strong></span>
              </div>
              <p className="hospital-reference-intro">{t('미딩·중화·떠이호 등 현재 위치에서 가까운 국제 진료기관 또는 종합병원에 먼저 연락해 진료 가능 여부를 확인하세요.')}</p>
              <div className="hospital-reference-grid">
                <article><strong>Family Medical Practice Hanoi</strong><span>{t('외국인 대상 국제 진료 클리닉')}</span></article>
                <article><strong>Vinmec International Hospital</strong><span>{t('국제 진료를 제공하는 종합병원')}</span></article>
                <article><strong>Hong Ngoc General Hospital</strong><span>{t('하노이 종합병원·외국인 진료 문의')}</span></article>
                <article><strong>International SOS Hanoi Clinic</strong><span>{t('국제 의료 지원·클리닉')}</span></article>
              </div>
              <p className="hospital-contact-note">{t('한국어 통역·국제 환자 접수·진료과·운영 시간은 날짜와 지점에 따라 달라질 수 있으니 방문 전 전화로 확인하세요. 응급 상황에서는 베트남 구급차 번호 115에 연락하고, 위치를 현지어 또는 지도 핀으로 전달하세요.')}</p>
            </section>
            <div className="health-disclaimer"><ShieldAlert size={14} /><span>{t('본 정보는 공공 보건·기상 데이터 기반 일반 예방 가이드이며, 증상 악화 시 전문 의료진 진료를 권장합니다.')}</span></div>
          </section>
          }
          </div>

          <footer className="footer"><div className="brand-mark"><Sun size={17} /></div><span>{t('SDGs 11 프로젝트')}</span><i /> <span>{t('지속가능한 도시와 공동체를 위한 하노이 기후·안전 가이드')}</span><small>{t('날씨 데이터: Open-Meteo')}</small></footer>
        </div>
      </main>
    </div>
  )
}

export default App
