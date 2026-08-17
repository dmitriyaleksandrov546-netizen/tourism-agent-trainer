const sourceProfiles = {
  'Турция': [
    {
      id: 'turkey-mfa-visa',
      type: 'official',
      title: 'МИД Турции — visa information for foreigners',
      url: 'https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa'
    },
    {
      id: 'turkey-embassy-russia',
      type: 'embassy',
      title: 'Посольство Турции / консульская информация',
      url: 'https://moscow-emb.mfa.gov.tr/'
    }
  ],
  'Египет': [
    {
      id: 'egypt-evisa',
      type: 'official',
      title: 'Egypt e-Visa portal',
      url: 'https://www.visa2egypt.gov.eg/'
    },
    {
      id: 'egypt-mfa',
      type: 'official',
      title: 'МИД Египта',
      url: 'https://www.mfa.gov.eg/'
    }
  ],
  'Таиланд': [
    {
      id: 'thailand-embassy-moscow-visa',
      type: 'embassy',
      title: 'Посольство Таиланда в Москве — visa',
      url: 'https://moscow.thaiembassy.org/en/page/visa'
    },
    {
      id: 'thailand-evisa',
      type: 'official',
      title: 'Thailand e-Visa',
      url: 'https://www.thaievisa.go.th/'
    }
  ],
  'ОАЭ': [
    {
      id: 'uae-gov-visa',
      type: 'official',
      title: 'UAE Government Portal — visa and Emirates ID',
      url: 'https://u.ae/en/information-and-services/visa-and-emirates-id'
    },
    {
      id: 'uae-icp',
      type: 'official',
      title: 'UAE ICP smart services',
      url: 'https://smartservices.icp.gov.ae/'
    }
  ]
};

const defaultSources = [
  {
    id: 'country-official-source',
    type: 'official',
    title: 'Официальный источник страны назначения',
    url: 'https://www.mid.ru/ru/maps/'
  }
];

export function getTravelDocumentSources(country = '') {
  return sourceProfiles[country] || defaultSources;
}

export function normalizeSourceText(input = '') {
  return String(input)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createSourceFingerprint(text = '') {
  const normalized = normalizeSourceText(text).slice(0, 50000);
  let hash = 5381;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) + hash) ^ normalized.charCodeAt(index);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function compareSourceSnapshots(currentSources = [], previousSnapshots = []) {
  const previousById = new Map(previousSnapshots.map((item) => [item.id, item]));
  return currentSources.map((source) => {
    const previous = previousById.get(source.id);
    let changeStatus = 'new';
    if (source.status !== 'ok') changeStatus = 'unavailable';
    else if (previous?.fingerprint === source.fingerprint) changeStatus = 'unchanged';
    else if (previous?.fingerprint) changeStatus = 'changed';

    return {
      ...source,
      previousFingerprint: previous?.fingerprint || '',
      previousExcerpt: previous?.excerpt || '',
      changeStatus
    };
  });
}

export function buildMonitoringReport({ country, checkedAt = new Date().toISOString(), sources = [], previousSnapshots = [] } = {}) {
  const comparedSources = compareSourceSnapshots(sources, previousSnapshots);
  const changes = comparedSources
    .filter((source) => source.changeStatus === 'changed')
    .map((source) => ({
      id: source.id,
      title: source.title,
      url: source.url,
      before: source.previousExcerpt || 'предыдущий фрагмент не сохранён',
      after: source.excerpt || 'новый фрагмент пустой'
    }));
  const unavailable = comparedSources.filter((source) => source.changeStatus === 'unavailable');
  const newSources = comparedSources.filter((source) => source.changeStatus === 'new');
  const status = changes.length ? 'changes-detected' : unavailable.length ? 'partial' : newSources.length ? 'baseline-created' : 'no-changes';

  return {
    ok: true,
    country,
    checkedAt,
    status,
    managerSummary: changes.length
      ? `Найдены изменения в ${changes.length} источнике(ах). Менеджеру нужно открыть детали и обновить памятку перед оплатой.`
      : unavailable.length
        ? `Часть источников не открылась (${unavailable.length}). Нельзя считать памятку полностью проверенной.`
        : 'Изменений по сохранённым источникам не найдено. Чеклист можно использовать, но перед оплатой всё равно сверить документы клиента.',
    checklist: [
      'Открыть официальный источник страны и сверить правила въезда по гражданству каждого туриста.',
      'Проверить сайт посольства/консульства: виза, срок паспорта, дети, транзит.',
      'Сверить памятку туроператора и авиакомпании по конкретному рейсу.',
      'Если мониторинг нашёл изменение — не отправлять клиенту старую памятку, пока менеджер не обновил чеклист.',
      'Зафиксировать дату проверки и источник в карточке заявки.'
    ],
    changes,
    sources: comparedSources,
    snapshots: comparedSources
      .filter((source) => source.status === 'ok')
      .map(({ id, title, url, fingerprint, excerpt, checkedAt: sourceCheckedAt }) => ({ id, title, url, fingerprint, excerpt, checkedAt: sourceCheckedAt || checkedAt }))
  };
}

export async function checkTravelDocumentSources({ country, previousSnapshots = [], fetchText = defaultFetchText, checkedAt = new Date().toISOString() } = {}) {
  const sourceProfilesForCountry = getTravelDocumentSources(country);
  const sources = await Promise.all(sourceProfilesForCountry.map(async (source) => {
    try {
      const rawText = await fetchText(source.url);
      const normalized = normalizeSourceText(rawText);
      return {
        ...source,
        status: 'ok',
        checkedAt,
        fingerprint: createSourceFingerprint(normalized),
        excerpt: normalized.slice(0, 360)
      };
    } catch (error) {
      return {
        ...source,
        status: 'error',
        checkedAt,
        fingerprint: '',
        excerpt: '',
        error: error?.message || 'source unavailable'
      };
    }
  }));

  return buildMonitoringReport({ country, checkedAt, sources, previousSnapshots });
}

async function defaultFetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'T-TRAINER travel document monitor' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}
