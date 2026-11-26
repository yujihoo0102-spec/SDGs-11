import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowUpRight, BadgeCheck, Bug, Building2, CalendarDays,
  Check, ChevronDown, Clock3, Cloud, CloudDrizzle, CloudRain, CloudSun, Droplets, Fan,
  Footprints, HeartPulse, MapPin, Moon, Shield, ShieldAlert, Shirt, ShoppingBag,
  Sun, Umbrella, Wind,
} from 'lucide-react'

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
type HourlyForecast = { time: string; temperature: number; rainChance: number }
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
type Disease = {
  id: DiseaseId
  name: string
  text: string
  icon: typeof Bug
  symptoms: string[]
  prevention: string[]
  localAdvice: string
}
type RiskLevel = '주의' | '경계' | '높음'

const sample: WeatherData = {
  temperature: 29, feelsLike: 34, humidity: 76, rainChance: 25, rainfall: 0,
  pm10: 42, pm25: 28, aqi: 72, wind: 11, code: 2, updatedAt: '',
}
const diseases: Disease[] = [
  {
    id: 'dengue',
    name: '뎅기열',
    text: '비가 오고 습한 날에는 모기 노출을 줄이세요.',
    icon: Bug,
    symptoms: ['갑작스러운 고열과 심한 두통', '눈 뒤쪽 통증, 근육·관절통', '메스꺼움 또는 피부 발진'],
    prevention: ['노출된 피부에 모기 기피제를 제품 설명에 따라 바르기', '긴 소매·긴 바지를 입고 방충망이나 모기장을 활용하기', '집 주변의 화분 받침·용기 등 고인 물을 비우기'],
    localAdvice: '고열이 나면 진료를 받으면서 뎅기열 가능성을 알리세요. 뎅기열이 의심될 때는 출혈 위험 때문에 이부프로펜·아스피린을 복용하지 말고, 해열제 선택은 의료진이나 약사에게 확인하세요. 심한 복통, 반복 구토, 잇몸 출혈, 호흡곤란이 있으면 즉시 응급 진료를 받으세요.',
  },
  {
    id: 'respiratory',
    name: '급성 호흡기 질환·천식',
    text: '대기질이 나쁘거나 습도 변화가 큰 날 호흡기를 보호하세요.',
    icon: Wind,
    symptoms: ['기침·콧물 또는 목 통증', '쌕쌕거림이나 가슴 답답함', '숨이 차거나 평소보다 심해지는 천식 증상'],
    prevention: ['AQI가 나쁜 날에는 외출과 격한 야외 운동을 줄이고 보건용 마스크 착용하기', '외출 후 손을 씻고, 코 세척이 필요하면 멸균 생리식염수를 사용하기', '실내를 환기하고 적정 습도를 유지하며 처방받은 흡입기를 챙기기'],
    localAdvice: '천식이 있다면 평소 처방받은 흡입기와 복용 정보를 휴대하고, 가까운 약국에서 약을 살 때 성분·용량을 확인하세요. 호흡곤란이 심하거나 흡입기로 호전되지 않으면 지체하지 말고 응급 진료를 받으세요.',
  },
  {
    id: 'flu',
    name: '계절성 독감',
    text: '환절기와 사람이 많은 실내에서는 호흡기 감염 예방에 신경 써요.',
    icon: ShieldAlert,
    symptoms: ['갑자기 시작되는 발열과 오한', '기침·인후통', '근육통과 심한 피로감'],
    prevention: ['비누로 손을 자주 씻고 기침·재채기는 옷소매로 가리기', '환기가 어려운 혼잡한 실내에서는 마스크 착용하기', '예방접종 시기와 본인에게 적합한 접종 여부를 의료기관에 문의하기'],
    localAdvice: '고열이나 기침이 지속되면 마스크를 착용하고 의료기관에 방문해 독감 검사가 가능한지 문의하세요. 임신부·고령자·기저질환자는 증상 초기에 진료를 권합니다. 항생제는 독감 바이러스에 효과가 없으므로 임의 복용하지 마세요.',
  },
  {
    id: 'waterborne',
    name: '수인성·식중독 질환',
    text: '폭우·고온다습한 날에는 물과 음식의 위생 상태를 확인하세요.',
    icon: Droplets,
    symptoms: ['설사와 복통', '메스꺼움 또는 구토', '발열과 탈수(심한 갈증·소변 감소)'],
    prevention: ['밀봉 상태가 확인되는 생수나 끓인 물을 마시고 길거리 얼음은 피하기', '음식은 충분히 익혀 바로 먹고 상온에 오래 둔 음식은 피하기', '식사 전과 화장실 이용 후 비누로 손 씻기'],
    localAdvice: '설사·구토가 있으면 안전한 물을 조금씩 자주 마시고, 약국에서 경구수분보충염(ORS)을 요청할 수 있어요. 혈변, 지속적인 고열, 심한 탈수 또는 물을 마시기 어려운 상태라면 의료기관 진료를 받으세요.',
  },
  {
    id: 'heat',
    name: '열사병·온열질환',
    text: '체감온도가 높을 때는 한낮 야외 활동과 탈수를 조심하세요.',
    icon: Sun,
    symptoms: ['두통·어지럼 또는 메스꺼움', '심한 갈증과 근육 경련', '뜨거운 피부, 의식 혼란 또는 실신'],
    prevention: ['물병을 챙겨 갈증이 나기 전부터 자주 수분 보충하기', '한낮 활동을 줄이고 그늘이나 냉방되는 실내에서 쉬기', '통풍되는 옷을 입고 동행자의 상태도 서로 살피기'],
    localAdvice: '열사병이 의심되면 즉시 응급 도움을 요청하고, 시원한 장소로 옮겨 옷을 느슨하게 한 뒤 몸을 식히세요. 의식이 흐리거나 구토하는 사람에게 억지로 물을 먹이지 마세요. 혼자 이동하기보다 가까운 사람에게 도움을 요청하세요.',
  },
]
const dailyHealthTasks = [
  '외출할 때 보건용 마스크 챙기기',
  '물병을 챙겨 수분 자주 보충하기',
  '야외 활동 전 모기 기피제 사용하기',
  '길거리 얼음과 개봉된 생수 피하기',
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
    return { time, temperature, rainChance: rainByHour[hour] }
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
const forecastTime = (time: string) => `${time.slice(11, 13)}시`
const forecastDay = (date: string) => new Intl.DateTimeFormat('ko-KR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))

function HourlyChart({ points }: { points: HourlyForecast[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  const minTemperature = Math.floor(Math.min(...points.map(point => point.temperature)) - 2)
  const maxTemperature = Math.ceil(Math.max(...points.map(point => point.temperature)) + 2)
  const chart = { x: 48, y: 20, width: 700, height: 158 }
  const x = (index: number) => chart.x + (index / Math.max(points.length - 1, 1)) * chart.width
  const y = (temperature: number) => chart.y + ((maxTemperature - temperature) / (maxTemperature - minTemperature)) * chart.height
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.temperature)}`).join(' ')
  const area = `${path} L ${x(points.length - 1)} ${chart.y + chart.height} L ${chart.x} ${chart.y + chart.height} Z`
  const selectAtPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const relativeX = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
    setSelected(Math.round(relativeX * (points.length - 1)))
  }
  const active = selected === null ? null : points[selected]
  return (
    <div className="hourly-chart-wrap" onPointerMove={selectAtPointer} onPointerDown={selectAtPointer} onPointerLeave={() => setSelected(null)}>
      {active && <div className="chart-tooltip" style={{ left: `${Math.min(89, Math.max(8, (selected! / (points.length - 1)) * 100))}%` }}><strong>{forecastTime(active.time)}</strong><span>{active.temperature}°C · 강수 {active.rainChance}%</span></div>}
      <svg className="hourly-chart" viewBox="0 0 800 238" role="img" aria-label="향후 24시간 기온과 강수확률 변화 그래프">
        {[0, 1, 2, 3].map(step => {
          const gridY = chart.y + (step / 3) * chart.height
          const temperature = Math.round(maxTemperature - (step / 3) * (maxTemperature - minTemperature))
          return <g key={step}><line x1={chart.x} x2={chart.x + chart.width} y1={gridY} y2={gridY} stroke="#edf0f5" strokeDasharray="4 5" /><text x="3" y={gridY + 3} className="chart-axis-label">{temperature}°</text><text x="765" y={gridY + 3} className="chart-axis-label">{100 - step * 33}%</text></g>
        })}
        {points.map((point, index) => {
          const barHeight = (point.rainChance / 100) * chart.height
          return <rect key={`rain-${point.time}`} x={x(index) - 5} y={chart.y + chart.height - barHeight} width="10" height={barHeight} rx="4" fill="#b9cec8" opacity=".72" />
        })}
        <path d={area} fill="#0f766e" fillOpacity=".08" />
        <path d={path} fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => <circle key={`temp-${point.time}`} cx={x(index)} cy={y(point.temperature)} r={selected === index ? 5 : 2.7} fill="#fff" stroke="#0f766e" strokeWidth="2" />)}
        {points.filter((_, index) => index % 4 === 0).map(point => {
          const index = points.indexOf(point)
          return <text key={`time-${point.time}`} x={x(index)} y="218" textAnchor="middle" className="chart-axis-label">{forecastTime(point.time)}</text>
        })}
      </svg>
      <div className="chart-legend"><span><i className="legend-temp" />기온 (°C)</span><span><i className="legend-rain" />강수확률 (%)</span><span className="chart-hint">그래프를 가리키거나 터치해 시간별 정보를 확인하세요</span></div>
    </div>
  )
}

function App() {
  const [weather, setWeather] = useState<WeatherData>(sample)
  const [mode, setMode] = useState<Mode>('live')
  const [activeSection, setActiveSection] = useState<'briefing' | 'forecast' | 'places' | 'health'>('briefing')
  const [airDetailsOpen, setAirDetailsOpen] = useState(false)
  const [area, setArea] = useState('전체 보기')
  const [category, setCategory] = useState('전체 장소')
  const [selectedPlace, setSelectedPlace] = useState(places[0].name)
  const [usingSample, setUsingSample] = useState(false)
  const [now, setNow] = useState(new Date())
  const [forecast, setForecast] = useState<ForecastData>(() => createSampleForecast())
  const [selectedDisease, setSelectedDisease] = useState<DiseaseId>('dengue')
  const [completedHealthTasks, setCompletedHealthTasks] = useState<string[]>([])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    const load = async () => {
      try {
        const [weatherResponse, airResponse] = await Promise.all([
          fetch('https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=Asia%2FBangkok'),
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
          rainChance: weatherJson.hourly.precipitation_probability[firstForecastHour + index] ?? 0,
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
  const score = Math.max(12, Math.min(98,
    100 - (isRain ? 32 : current.rainChance >= 40 ? 12 : 0) - (isHeat ? 27 : current.temperature >= 32 ? 10 : 0) -
    (current.aqi > 150 ? 25 : current.aqi > 100 ? 16 : current.aqi > 50 ? 7 : 0) - (current.humidity > 85 ? 10 : 0)))
  const scoreLine = score >= 80 ? '가벼운 외출하기 좋은 날이에요' : score >= 60 ? '준비를 챙기면 외출할 수 있어요' : score >= 40 ? '실내 활동을 추천해요' : '꼭 필요한 외출만 해주세요'
  const filteredPlaces = places.filter(place => (area === '전체 보기' || place.area === area) && (category === '전체 장소' || place.category === category))
  const activePlace = filteredPlaces.find(place => place.name === selectedPlace) ?? filteredPlaces[0] ?? null
  const forecastMin = Math.min(...forecast.daily.map(day => day.min))
  const forecastMax = Math.max(...forecast.daily.map(day => day.max))
  const forecastRange = Math.max(forecastMax - forecastMin, 1)
  const mask = current.aqi > 150 ? 'KF94 마스크 필수' : current.aqi > 100 ? '보건용 마스크 권장' : current.aqi > 50 ? '민감한 분은 마스크 권장' : '마스크 미착용 가능'
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
    { id: 'briefing' as const, label: '오늘의 브리핑', icon: CloudSun, summary: `${codeText(current.code)} · ${current.temperature}°C, AQI ${current.aqi}. ${scoreLine}.` },
    { id: 'forecast' as const, label: '시간·주간 예보', icon: CalendarDays, summary: `오늘 강수 확률 ${current.rainChance}% · 24시간 변화와 7일 예보를 확인하세요.` },
    { id: 'places' as const, label: '안전 대피·한인 거점', icon: MapPin, summary: `${area === '전체 보기' ? '하노이 한인 거주 권역' : area}의 실내 거점을 확인하고, 폭우 시에는 당국 안내와 침수 정보를 우선하세요.` },
    { id: 'health' as const, label: '건강·질병 가이드', icon: HeartPulse, summary: `${season} · 오늘은 ${diseases.filter(item => riskLevel(item.id) === '높음').map(item => item.name).join('·') || '일상 예방 수칙'}에 유의하고 건강 체크리스트를 실천하세요.` },
  ]

  return (
    <div className="app-shell">
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-identity">
            <strong className="header-brand-name">SDGs 11</strong>
          </div>
          <div className="topbar-right">
            <div className="mode-switch" role="group" aria-label="날씨 시뮬레이션">{modeButtons.map(button => <button key={button.value} className={mode === button.value ? 'selected' : ''} aria-pressed={mode === button.value} aria-label={`${button.label} 시뮬레이션, 다시 누르면 실시간 날씨로 돌아갑니다`} onClick={() => setMode(mode === button.value ? 'live' : button.value)}>{button.label}</button>)}</div>
          </div>
        </header>

        <nav className="section-tabs" role="tablist" aria-label="앱 섹션">
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
          <section className="page-heading">
            <div><div className="eyebrow"><MapPin size={13} /> 하노이 · SDGs 11</div><h1>{sections.find(section => section.id === activeSection)?.label}</h1><p>{now.toLocaleDateString('ko-KR', { timeZone: 'Asia/Bangkok', month: 'long', day: 'numeric', weekday: 'long' })} · 지속가능한 도시를 위한 오늘의 기후·안전 정보</p></div>
          </section>

          <div className="section-summary" role="note"><span>핵심 요약</span><p>{sections.find(section => section.id === activeSection)?.summary}</p></div>
          <div className="active-panel" role="tabpanel" id={`section-panel-${activeSection}`} aria-labelledby={`section-tab-${activeSection}`}>

          {activeSection === 'briefing' && <>
          {(isRain || isHeat || airBad) && <div className={`alert-banner ${isRain ? 'rain-alert' : isHeat ? 'heat-alert' : 'air-alert'}`}><div className="alert-icon"><ShieldAlert size={20} /></div><div><strong>{isRain ? '폭우 주의 — 실내 대피 장소를 미리 확인하세요' : isHeat ? '폭염 주의 — 한낮 야외 활동을 피하고 수분을 보충하세요' : '대기질 나쁨 — 외출 시 보건용 마스크를 착용하세요'}</strong><span>{isRain ? `강수 확률 ${current.rainChance}% · 실내에 머물고 외출 시 우산을 꼭 챙기세요.` : isHeat ? `${current.temperature}°C · 그늘에서 쉬고 가까운 실내 공간을 이용해 주세요.` : `미국 AQI ${current.aqi} · 민감군은 장시간 야외 활동을 줄여 주세요.`}</span></div><button type="button" onClick={() => setActiveSection('places')}>대피 장소 보기 <ArrowUpRight size={15} /></button></div>}
          <section id="오늘" className="hero-grid">
            <div className={`weather-card ${isRain ? 'weather-rain' : isHeat ? 'weather-heat' : 'weather-clear'}`}>
              <div className="weather-card-top"><div><span className="card-overline">현재 날씨</span><div className="weather-location"><MapPin size={15} /> 하노이, 베트남 <ChevronDown size={14} /></div></div><div className="weather-date">{now.toLocaleDateString('ko-KR', { timeZone: 'Asia/Bangkok', month: 'long', day: 'numeric', weekday: 'long' })}</div></div>
              <div className="weather-main"><div><div className="temperature">{current.temperature}<span>°</span></div><div className="weather-description">{codeText(current.code)}</div><div className="feels-like">체감 온도 {current.feelsLike}°C</div></div><div className="weather-illustration">{weatherIcon(current.code, 62)}</div></div>
              <div className="weather-stats"><div><Droplets size={16} /><span>습도</span><strong>{current.humidity}<small>%</small></strong></div><div><CloudRain size={16} /><span>강수 확률</span><strong>{current.rainChance}<small>%</small></strong></div><div><Wind size={16} /><span>바람</span><strong>{current.wind}<small> km/h</small></strong></div></div>
              <div className="weather-foot"><span><i /> {mode === 'live' ? (usingSample ? '예시 데이터' : '실시간 업데이트') : '시뮬레이션 모드'}</span><span>{weather.updatedAt ? `기준 ${weather.updatedAt.slice(11, 16)}` : '하노이 현지 기준'}</span></div>
            </div>

            <div className="score-card"><div className="score-top"><div><span className="card-overline">오늘의 외출 컨디션</span><h2>외출 적합도</h2></div><div className="score-icon"><Activity size={18} /></div></div><div className="score-display"><div className="score-ring" style={{ '--score': `${score}%`, '--score-color': score >= 70 ? '#0f766e' : score >= 40 ? '#c17b16' : '#c64b48' } as React.CSSProperties}><div><strong>{score}</strong><span>점</span></div></div><div className="score-caption"><strong>{scoreLine}</strong><span>{score >= 70 ? '준비만 잘하면 기분 좋은 외출!' : '오늘의 날씨에 맞춰 안전하게 준비해요.'}</span></div></div><div className="score-divider" /><div className="score-factors"><div><span className={isRain ? 'factor-warn' : ''}><CloudRain size={14} /> 강수</span><b>{isRain ? '주의' : current.rainChance > 30 ? '보통' : '좋음'}</b></div><div><span className={isHeat ? 'factor-warn' : ''}><Sun size={14} /> 기온</span><b>{isHeat ? '폭염' : current.temperature > 31 ? '더움' : '쾌적'}</b></div><div><span className={airBad ? 'factor-warn' : ''}><Wind size={14} /> 공기</span><b>{qualityText(current.aqi)}</b></div></div><div className="score-tip"><BadgeCheck size={14} /> {score < 60 ? '무리한 야외 활동보다 가까운 실내 장소를 추천해요.' : '물과 자외선 차단제를 챙기면 더 좋아요.'}</div></div>
            <div className="brief-outfit">
              <div className="brief-outfit-heading"><div className="brief-icon"><Shirt size={17} /></div><div><span className="card-overline">외출 준비 요약</span><h2>오늘의 옷차림</h2></div></div>
              <p>{current.temperature >= 33 ? '통기성 좋은 반팔과 가벼운 면바지' : current.temperature >= 28 ? '얇은 반팔과 통풍이 잘되는 하의' : '얇은 긴팔 셔츠와 가벼운 겉옷'}</p>
              <div className="brief-outfit-detail"><div><Shield size={15} /><span>마스크</span><b>{mask}</b></div><div>{isRain ? <Umbrella size={15} /> : <Droplets size={15} />}<span>준비물</span><b>{isRain ? '우산 · 방수 겉옷' : isHeat ? '물 · 선크림 · 손선풍기' : '물 · 선크림'}</b></div></div>
              <a href="#옷차림">준비물 자세히 보기 <ArrowUpRight size={14} /></a>
            </div>
          </section>

          </>}

          {activeSection === 'forecast' && <section className="section-block forecast-section">
            <div className="section-heading"><div><div className="eyebrow">날씨 예보</div><h2>하노이 날씨 예보</h2><p>시간대별 변화와 앞으로의 한 주 날씨를 미리 확인하세요.</p></div><span className="place-count"><CloudSun size={14} /> 7일 예보</span></div>
            <div className="forecast-card hourly-card">
              <div className="forecast-card-heading"><div><strong>향후 24시간 예보 그래프</strong><span>기온과 강수확률을 시간대별로 확인해요.</span></div><span className="forecast-updated">{mode === 'live' && !usingSample ? '실시간 예보' : '하노이 예시 예보'}</span></div>
              <HourlyChart points={forecast.hourly} />
            </div>
            <div className="forecast-card daily-card">
              <div className="forecast-card-heading"><div><strong>7일 주간 예보</strong><span>이번 주 기온 범위와 비 소식을 확인해요.</span></div><div className="temp-range-key"><i /> 최저 · 최고 기온</div></div>
              <div className="daily-forecast-grid">{forecast.daily.map((day, index) => <article className="daily-forecast" key={day.date}>
                <span className="daily-weekday">{index === 0 ? '오늘' : forecastDay(day.date)}</span>
                <span className="daily-date">{day.date.slice(5).replace('-', '.')}</span>
                <span className={`daily-weather-icon ${day.rainChance >= 50 ? 'rainy' : ''}`}>{weatherIcon(day.code)}</span>
                <span className="daily-rain"><CloudRain size={12} /> {day.rainChance}%</span>
                <div className="daily-temperatures"><span>{day.min}°</span><div className="daily-range-track"><i style={{ left: `${((day.min - forecastMin) / forecastRange) * 100}%`, width: `${Math.max(8, ((day.max - day.min) / forecastRange) * 100)}%` }} /></div><b>{day.max}°</b></div>
              </article>)}</div>
              <div className="daily-range-labels"><span>{forecastMin}°C</span><span>{forecastMax}°C</span></div>
            </div>
          </section>
          }

          {activeSection === 'briefing' && <>
          <section id="대기질" className="section-block"><div className="section-heading"><div><div className="eyebrow">대기 환경</div><h2>오늘의 공기 상태 <span className={`quality-badge ${current.aqi > 100 ? 'bad' : current.aqi > 50 ? 'moderate' : ''}`}>{qualityText(current.aqi)}</span></h2><p>하노이의 대기질을 확인하고 호흡기를 보호해요.</p></div><button className="text-button" type="button" aria-expanded={airDetailsOpen} aria-controls="air-quality-details" onClick={() => setAirDetailsOpen(open => !open)}>{airDetailsOpen ? '상세 정보 접기' : '상세 정보'} <ArrowUpRight size={15} /></button></div>
            <div className="air-grid"><div className={`air-card aqi-card air-grade-${qualityText(current.aqi).replace(' ', '-')}`}><div className="air-card-heading"><div className="metric-icon purple"><Activity size={17} /></div><span>미국 통합 대기질 지수</span><button className="info-dot" type="button" aria-label="대기질 등급과 행동 요령 자세히 보기" aria-expanded={airDetailsOpen} aria-controls="air-quality-details" onClick={() => setAirDetailsOpen(open => !open)}>i</button></div><div className="aqi-line"><strong>{current.aqi}</strong><span>AQI</span><div className={`aqi-label air-grade-${qualityText(current.aqi).replace(' ', '-')}`}><i />{qualityText(current.aqi)}</div></div><div className="aqi-scale"><span style={{ left: `${Math.min(100, (current.aqi / 300) * 100)}%` }} /></div><div className="aqi-scale-labels"><span>좋음</span><span>보통</span><span>나쁨</span><span>매우 나쁨</span></div></div><div className={`air-card pollutant-card air-grade-${pm10Quality.replace(' ', '-')}`}><div className="air-card-heading"><div className="metric-icon mint"><Wind size={17} /></div><span>미세먼지 · PM10</span></div><div className="pollutant-reading">{current.pm10}<small> μg/m³</small></div><div className="pollutant-bottom"><span>미국 AQI 등급 기준</span><span className={`mini-good air-grade-${pm10Quality.replace(' ', '-')}`}>{pm10Quality}</span></div><div className="mini-progress"><i style={{ width: `${Math.min(100, (current.pm10 / 300) * 100)}%` }} /></div></div><div className={`air-card pollutant-card air-grade-${pm25Quality.replace(' ', '-')}`}><div className="air-card-heading"><div className="metric-icon blue"><Wind size={17} /></div><span>초미세먼지 · PM2.5</span></div><div className="pollutant-reading">{current.pm25}<small> μg/m³</small></div><div className="pollutant-bottom"><span>미국 AQI 등급 기준</span><span className={`mini-good air-grade-${pm25Quality.replace(' ', '-')}`}>{pm25Quality}</span></div><div className="mini-progress"><i className="blue-bar" style={{ width: `${Math.min(100, (current.pm25 / 100) * 100)}%` }} /></div></div></div>
            {airDetailsOpen && <div className="air-details-panel" id="air-quality-details">
              <div className="air-details-heading"><div><span className="eyebrow">측정값 안내</span><h3>대기질 등급과 오늘의 행동 요령</h3></div><span className="air-live-reading">AQI {current.aqi} {qualityText(current.aqi)} · PM10 {current.pm10} ({pm10Quality}) · PM2.5 {current.pm25} ({pm25Quality})</span></div>
              <p className="air-action"><ShieldAlert size={17} /><span>{airAction}</span></p>
              <div className="air-table-wrap"><table className="air-ranges-table"><thead><tr><th>등급</th><th>US AQI</th><th>PM10 (μg/m³)</th><th>PM2.5 (μg/m³)</th></tr></thead><tbody>
                {airQualityRanges.map(range => <tr key={range.label} className={qualityText(current.aqi) === range.label ? 'current-air-range' : ''}><th scope="row">{range.label}</th><td>{range.aqi}</td><td>{range.pm10}</td><td>{range.pm25}</td></tr>)}
              </tbody></table></div>
              <p className="air-data-source">하노이 실시간 대기질 데이터: Open-Meteo Air Quality API (US AQI, PM10, PM2.5). 등급 구간은 미국 EPA AQI 기준을 간단히 묶어 안내합니다.</p>
            </div>}
          </section>

          <section id="옷차림" className="section-block"><div className="section-heading"><div><div className="eyebrow">외출 준비</div><h2>오늘의 외출 준비</h2><p>현재 날씨에 꼭 맞는 옷차림과 준비물을 챙겨요.</p></div><div className="recommend-tag"><BadgeCheck size={15} /> 맞춤 추천</div></div>
            <div className="prep-grid"><div className="prep-card outfit-card"><div className="prep-title"><div className="prep-icon lavender"><Sun size={18} /></div><div><strong>오늘의 옷차림</strong><span>{current.temperature}°C · 습도 {current.humidity}% 기준</span></div></div><div className="outfit-row"><span className="outfit-icon"><Shirt size={16} /></span><div><b>상의</b><span>{current.temperature >= 33 ? '통기성 좋은 반팔 면 티셔츠' : current.temperature >= 28 ? '얇은 반팔 · 가벼운 블라우스' : '얇은 긴팔 셔츠 · 가디건'}</span></div><Check size={15} /></div><div className="outfit-row"><span className="outfit-icon"><Footprints size={16} /></span><div><b>하의</b><span>{current.humidity > 80 ? '통풍이 잘되는 얇은 면바지' : '가벼운 면바지 · 편한 스커트'}</span></div><Check size={15} /></div><div className="outfit-row"><span className="outfit-icon"><CloudSun size={16} /></span><div><b>겉옷</b><span>{isRain ? '작은 우산 또는 방수 재킷' : current.temperature > 32 ? '실내 냉방 대비 얇은 가디건' : '필요 시 얇은 겉옷'}</span></div><Check size={15} /></div><div className={`mask-note ${airBad ? 'mask-alert' : ''}`}><div className="mask-symbol"><Shield size={16} /></div><div><b>마스크 착용</b><span>{mask}</span></div><span className="mask-status">{current.aqi > 100 ? '권장' : '선택'}</span></div></div>
              <div className="prep-card essentials-card"><div className="prep-title"><div className="prep-icon peach"><ShoppingBag size={17} /></div><div><strong>꼭 챙겨요</strong><span>오늘의 필수 휴대품</span></div></div><div className="essential-list"><div className={isRain ? 'essential-active' : ''}><span><Umbrella size={16} /></span><b>접이식 우산</b><small>{isRain ? '필수' : current.rainChance >= 30 ? '챙기면 좋아요' : '선택'}</small></div><div><span><Sun size={16} /></span><b>선크림</b><small>SPF 30 이상</small></div><div className={isHeat ? 'essential-active' : ''}><span><Fan size={16} /></span><b>손선풍기</b><small>{isHeat ? '필수' : '더울 때 유용해요'}</small></div><div><span><Droplets size={16} /></span><b>물병</b><small>수분 보충</small></div></div><div className="essentials-tip"><BadgeCheck size={13} /> {isHeat ? '한낮에는 그늘에서 자주 쉬어 주세요.' : isRain ? '비가 많이 올 때는 지하도와 저지대를 피하세요.' : '자외선이 강한 날엔 선크림을 덧발라 주세요.'}</div></div></div>
          </section>
          </>}

          {activeSection === 'places' && <section id="안전한장소" className="section-block places-section">
            <div className="section-heading">
              <div><div className="eyebrow">이상기후 대피 · 휴식</div><h2>한인 거주 지역 안전 거점</h2><p>권역별 실내 대피·휴식 장소와 위치를 확인하세요.</p></div>
              <span className="place-count"><MapPin size={14} /> 하노이 주요 한인 권역</span>
            </div>
            <div className="filters">
              <div className="area-filters" role="group" aria-label="한인 거주 권역 선택">
                {areas.map(item => <button aria-pressed={area === item} className={area === item ? 'filter-active' : ''} key={item} onClick={() => setArea(item)}>{item}</button>)}
              </div>
              <div className="category-select"><select value={category} onChange={event => setCategory(event.target.value)} aria-label="장소 유형 선택"><option>전체 장소</option><option>쇼핑몰</option><option>복합시설</option><option>상가·커뮤니티</option></select><ChevronDown size={14} /></div>
            </div>
            <p className="place-safety-note">아래는 공식 지정 대피소가 아닌 실내 거점 후보입니다. 운영시간·한국어 응대·공기 여과 여부를 방문 전 확인하고, 폭우 시 지하공간과 침수 우려 지역을 피하며 현장·당국 안내를 우선하세요.</p>
            <div className="place-explorer">
              <div>
                <div className="places-grid">
                  {filteredPlaces.map(item => {
                    const PlaceIcon = item.icon
                    return (
                      <article className={`place-card ${activePlace?.name === item.name ? 'place-card-selected' : ''}`} key={item.name}>
                        <div className="place-card-heading">
                          <div className="place-art"><PlaceIcon size={18} /></div>
                          <div className="place-meta"><span><MapPin size={12} /> {item.area}</span><span>{item.category}</span></div>
                        </div>
                        <h3>{item.name}</h3>
                        <details className="place-details">
                          <summary>장소 정보 자세히 보기</summary>
                          <p className="place-description">{item.detail}</p>
                          <div className="place-resident-access"><strong>한인 거주지 인접</strong><span>{item.residentAccess}</span></div>
                          <div className="place-recommendations">
                            {item.recommendations.map(recommendation => <p key={recommendation}>{recommendation}</p>)}
                          </div>
                        </details>
                        <div className="place-card-footer">
                          <div className="place-hours"><Clock3 size={13} /><span>{item.hours}</span></div>
                          <div className="place-actions">
                            <button className="place-select" type="button" aria-pressed={activePlace?.name === item.name} onClick={() => setSelectedPlace(item.name)}><MapPin size={13} /> 지도에서 보기</button>
                            <a className="place-map-link" href={item.googleMapsUrl} target="_blank" rel="noopener noreferrer">구글 지도 앱/웹으로 길찾기 <ArrowUpRight size={14} /></a>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
                {filteredPlaces.length === 0 && <div className="empty-state">조건에 맞는 장소가 없어요. 다른 필터를 선택해 주세요.</div>}
              </div>
              <aside className="place-map-panel">
                {activePlace ? (
                  <>
                    <div className="place-map-heading"><div><span>선택한 안전 거점</span><strong>{activePlace.name}</strong><small>{activePlace.area}</small></div><MapPin size={17} /></div>
                    <iframe
                      className="place-map-frame"
                      key={activePlace.name}
                      src={activePlace.mapEmbedUrl}
                      title={`${activePlace.name} 구글 지도`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <a className="map-directions-link" href={activePlace.googleMapsUrl} target="_blank" rel="noopener noreferrer">구글 지도에서 길찾기 <ArrowUpRight size={14} /></a>
                  </>
                ) : <div className="empty-state">지도에 표시할 거점이 없습니다.</div>}
              </aside>
            </div>
          </section>
          }

          {activeSection === 'health' && <section id="건강가이드" className="section-block health-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">계절 건강 안내</div>
                <h2>하노이 건강 가이드 <span className="season-chip"><Moon size={12} /> {season}</span></h2>
                <p>현재 기온·습도·강수·대기질과 선택한 상황을 반영한 예방 안내예요.</p>
              </div>
              <span className="health-mark"><HeartPulse size={18} /></span>
            </div>
            <div className="health-grid" role="tablist" aria-label="질병별 건강 가이드">
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
                      <span className="disease-season">{season} · 오늘의 위험도</span>
                      <span className="health-card-title">{item.name}</span>
                      <span className="health-card-description">{item.text}</span>
                    </span>
                    <span className={`risk-badge risk-${level}`}>{level}</span>
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
                    <span className="detail-overline">질병별 예방 가이드</span>
                    <h3>{activeDisease.name}</h3>
                  </div>
                  <span className={`risk-badge risk-${riskLevel(activeDisease.id)}`}>오늘 {riskLevel(activeDisease.id)}</span>
                </div>
                <div className="detail-columns">
                  <section className="detail-block">
                    <h4>주요 의심 증상</h4>
                    <ul className="symptom-list">{activeDisease.symptoms.map(symptom => <li key={symptom}>{symptom}</li>)}</ul>
                  </section>
                  <section className="detail-block">
                    <h4>일상 예방 체크</h4>
                    <ul className="prevention-list">{activeDisease.prevention.map(item => <li key={item}><Check size={14} />{item}</li>)}</ul>
                  </section>
                </div>
                <details className="local-advice">
                  <summary className="local-advice-title"><MapPin size={14} /> 하노이 현지 대처 자세히 보기</summary>
                  <p>{activeDisease.localAdvice}</p>
                </details>
              </article>
              <aside className="daily-health-card">
                <div className="daily-health-heading">
                  <span className="daily-health-icon"><Check size={15} /></span>
                  <div><h3>오늘의 건강 실천</h3><span>{completedHealthTasks.length}/{dailyHealthTasks.length} 완료</span></div>
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
                        <span>{task}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="health-progress"><span style={{ width: `${(completedHealthTasks.length / dailyHealthTasks.length) * 100}%` }} /></div>
              </aside>
            </div>
            <div className="health-disclaimer"><ShieldAlert size={14} /><span>본 안내는 공공 기상 및 보건 정보를 바탕으로 한 일반 예방 가이드이며, 고열·호흡곤란 등 증상 지속 시 현지 의료기관 진료를 권장합니다.</span></div>
          </section>
          }
          </div>

          <footer className="footer"><div className="brand-mark"><Sun size={17} /></div><span>SDGs 11 프로젝트</span><i /> <span>지속가능한 도시와 공동체를 위한 하노이 기후·안전 가이드</span><small>날씨 데이터: Open-Meteo</small></footer>
        </div>
      </main>
    </div>
  )
}

export default App
