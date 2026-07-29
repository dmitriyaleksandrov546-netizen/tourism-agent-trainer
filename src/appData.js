export const menuSections = [
  {
    id: 'dashboard',
    title: 'Дашборд',
    eyebrow: 'Раздел / Дашборд руководителя',
    headline: 'Понятно, кто готов к клиентам, а кто пока опасен для продаж',
    description: 'Быстрый обзор испытательного срока: прогресс, слабые места, ближайшие тренировки и риск слить заявку.'
  },
  {
    id: 'trainer',
    title: 'Тренажёр',
    eyebrow: 'Раздел / Тренажёр нейроклиента',
    headline: 'Отработка сложных клиентов до выхода на реальные заявки',
    description: 'Сценарий строится вокруг семьи, бюджета, отеля, возражений и скрытых критериев. После каждого ответа — оценка по продажам и честности.'
  },
  {
    id: 'hotels',
    title: 'Отели',
    eyebrow: 'Раздел / База отелей',
    headline: 'Карточки отелей без рекламной воды: кому продавать, где риски',
    description: 'Каждая карточка показывает fit, минусы, источник, дату проверки и уровень уверенности.'
  },
  {
    id: 'tests',
    title: 'Тесты',
    eyebrow: 'Раздел / Проверка знаний',
    headline: 'Короткие тесты после тренировки, чтобы закрепить реальные правила продаж',
    description: 'Не академическая LMS, а контроль опасных ошибок: дети, бюджет, отзывы, пляж, закрытие на следующий шаг.'
  },
  {
    id: 'agents',
    title: 'Агенты',
    eyebrow: 'Раздел / Новые агенты',
    headline: 'Список стажёров и решение: выпускать к клиентам или доучивать',
    description: 'Руководитель видит готовность, средний балл, провалы и следующий шаг по каждому новичку.'
  },
  {
    id: 'admin',
    title: 'Админка',
    eyebrow: 'Раздел / Настройки',
    headline: 'Базовая настройка программы испытательного срока',
    description: 'Первая итерация: роли, программа, правила оценки и источники отельной базы.'
  }
];

export const trainingTasks = [
  { id: 'task-1', title: 'Семья 2+2: Турция, бюджет жмёт', type: 'диалог', status: 'done', score: 82 },
  { id: 'task-2', title: 'Египет: возражение “у другого дешевле”', type: 'диалог', status: 'done', score: 76 },
  { id: 'task-3', title: 'ОАЭ: премиум-клиент без гарантий', type: 'диалог', status: 'done', score: 69 },
  { id: 'task-4', title: 'Плохие отзывы: отделить риск от шума', type: 'тест', status: 'in_progress', score: null },
  { id: 'task-5', title: 'Дети: пляж, питание, трансфер, сон', type: 'карточки', status: 'locked', score: null },
  { id: 'task-6', title: 'Финальный звонок с агрессивным клиентом', type: 'экзамен', status: 'locked', score: null }
];

export const hotelKnowledgeBase = [
  {
    name: 'Belek Aqua Club 5*',
    country: 'Турция',
    resort: 'Белек',
    segment: 'семьи с детьми',
    fit: 'аквапарк, зелёная территория, питание выше среднего, удобно для детей',
    notFor: 'клиент с жёстким бюджетом и ожиданием “дёшево как премиум”',
    risk: 'риск: обычно выше бюджета, надо ловить даты; в сезон может быть шумно',
    tags: 'дети риск высокая уверенность',
    confidence: 'высокая',
    source: 'оператор + отзывы',
    checkedAt: '17.07.2026'
  },
  {
    name: 'Side Family Resort 5*',
    country: 'Турция',
    resort: 'Сиде',
    segment: 'семьи / первая линия',
    fit: 'песчаный пляж, детская инфраструктура, спокойный формат',
    notFor: 'клиент, которому критичен свежий номерной фонд',
    risk: 'номера частично уставшие, в сезон очереди в ресторане',
    confidence: 'средняя',
    source: 'карточка агентства',
    checkedAt: '18.07.2026'
  },
  {
    name: 'Alanya Sun Beach 4+',
    country: 'Турция',
    resort: 'Аланья',
    segment: 'эконом-семьи',
    fit: 'может пройти по бюджету, понятный массовый вариант',
    notFor: 'семьи с младенцем, если важен короткий трансфер и идеальный вход в море',
    risk: 'длинный трансфер, вход в море неидеален для 2 лет',
    confidence: 'средняя',
    source: 'отзывы + менеджеры',
    checkedAt: '16.07.2026'
  },
  {
    name: 'Sharm Reef Bay 5*',
    country: 'Египет',
    resort: 'Шарм-эль-Шейх',
    segment: 'пары / риф',
    fit: 'хороший риф, нормальная цена, понятный all inclusive',
    notFor: 'клиент, который хочет пологий песчаный вход без понтона',
    risk: 'ветер зимой, пляж с понтона',
    confidence: 'высокая',
    source: 'оператор',
    checkedAt: '19.07.2026'
  },
  {
    name: 'Jumeirah Calm Bay 5*',
    country: 'ОАЭ',
    resort: 'Дубай',
    segment: 'премиум',
    fit: 'сервис, пляж, премиальная аудитория, высокий чек',
    notFor: 'клиент, который не готов к депозитам и дорогим ресторанам',
    risk: 'депозит, высокий чек на месте, нужно проверять стройку рядом',
    confidence: 'средняя',
    source: 'сайт отеля',
    checkedAt: '15.07.2026'
  }
];

export const agents = [
  { name: 'Анна Сергеева', role: 'стажёр', readiness: 50, avgScore: 76, risk: 'средний', next: 'Плохие отзывы + дети' },
  { name: 'Илья Новиков', role: 'новый агент', readiness: 33, avgScore: 61, risk: 'высокий', next: 'Возражения по цене' },
  { name: 'Мария Орлова', role: 'стажёр', readiness: 83, avgScore: 84, risk: 'низкий', next: 'Финальный экзамен' }
];

export const testQuestions = [
  {
    question: 'Клиент просит 5*, первая линия, аквапарк и бюджет сильно ниже рынка. Что делать первым?',
    answer: 'Уточнить критичные критерии и честно объяснить компромиссы бюджета, не обещая невозможное.'
  },
  {
    question: 'В отзывах пишут “еда плохая”. Как правильно ответить?',
    answer: 'Проверить даты и массовость жалобы, отделить единичный отзыв от системной проблемы, дать альтернативу.'
  },
  {
    question: 'Семья с детьми 2 и 11 лет. Какие вводные нельзя забыть?',
    answer: 'Пляж/заход, питание, сон младшего, трансфер, активность старшего, шум, врач/безопасность.'
  }
];

export const adminSettings = [
  ['Программа', 'Испытательный срок 10 дней'],
  ['Минимальный проходной балл', '78/100'],
  ['Роли', 'Руководитель, агент, методист'],
  ['Источники отелей', 'оператор, сайт отеля, отзывы, заметки агентства'],
  ['Правило AI', 'не придумывать факты без источника']
];

export function getSectionById(id) {
  return menuSections.find((section) => section.id === id) || menuSections[0];
}

export function filterHotels(query = '') {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return hotelKnowledgeBase;

  return hotelKnowledgeBase.filter((hotel) => {
    const haystack = [hotel.name, hotel.country, hotel.resort, hotel.segment, hotel.fit, hotel.notFor, hotel.risk, hotel.tags, hotel.confidence, hotel.source].join(' ').toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}

export function getAgentReadiness(tasks = trainingTasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === 'done').length;
  return {
    total,
    completed,
    percent: total ? Math.round((completed / total) * 100) : 0
  };
}
