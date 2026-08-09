export const tourvisionHotels = [
  {
    name: 'Belek Aqua Club 5*',
    country: 'Турция',
    resort: 'Белек',
    segment: 'семьи с детьми',
    fit: 'аквапарк, зелёная территория, питание выше среднего, удобно для детей',
    notFor: 'клиент с жёстким бюджетом и ожиданием «дёшево как премиум»',
    risk: 'обычно выше бюджета, надо ловить даты; в сезон может быть шумно',
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

export function filterTourvisionHotels(query = '') {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return tourvisionHotels;

  return tourvisionHotels.filter((hotel) => {
    const haystack = [
      hotel.name,
      hotel.country,
      hotel.resort,
      hotel.segment,
      hotel.fit,
      hotel.notFor,
      hotel.risk,
      hotel.confidence,
      hotel.source
    ].join(' ').toLowerCase();

    return tokens.every((token) => haystack.includes(token));
  });
}
