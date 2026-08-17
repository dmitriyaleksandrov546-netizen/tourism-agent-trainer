const TOURVISOR_CART_ENDPOINT = 'https://tourvisor.ru/xml/cart2.php';

export function extractTourvisorCartId(input = '') {
  const text = String(input || '');
  const hashMatch = text.match(/[#&?]tvcartid=(\d+)/i);
  if (hashMatch) return hashMatch[1];
  const explicitMatch = text.match(/\btvcartid\s*[:=]\s*(\d+)/i);
  return explicitMatch ? explicitMatch[1] : '';
}

function formatMoney(value, currency = 'RUB') {
  if (value === undefined || value === null || value === '') return '';
  const number = Number(value);
  if (Number.isFinite(number)) return `${number.toLocaleString('ru-RU')} ${currency}`;
  return `${value} ${currency}`.trim();
}

function hotelByCode(hotels = [], code) {
  return hotels.find((hotel) => String(hotel.hotelcode || hotel.code || hotel.id) === String(code)) || {};
}

function formatHotel(hotel = {}) {
  const name = hotel.hotelname || hotel.name || hotel.title || 'отель без названия';
  const stars = hotel.stars || hotel.star || hotel.hotelstars || '';
  const region = [hotel.regionname, hotel.subregionname].filter(Boolean).join(', ');
  const rating = hotel.rating || hotel.rank || hotel.reviewrating || '';
  const descr = hotel.description || hotel.hoteldescription || hotel.comment || '';
  return [
    `Отель: ${name}${stars ? ` ${stars}*` : ''}`,
    region && `Регион: ${region}`,
    rating && `Рейтинг/оценка: ${rating}`,
    descr && `Описание: ${String(descr).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`
  ].filter(Boolean).join('\n');
}

function formatTour(tour = {}, hotels = []) {
  const hotel = hotelByCode(hotels, tour.hotelcode);
  const hotelName = tour.hotelname || hotel.hotelname || hotel.name || `hotelcode ${tour.hotelcode || 'unknown'}`;
  return [
    `Тур: ${hotelName}`,
    tour.countryname && `Страна: ${tour.countryname}`,
    tour.departurename && `Вылет: ${tour.departurename}`,
    tour.flydate && `Дата: ${tour.flydate}`,
    tour.nights && `Ночей: ${tour.nights}`,
    tour.placement && `Туристы: ${tour.placement}`,
    tour.room && `Номер: ${tour.room}`,
    (tour.mealfull || tour.meal) && `Питание: ${tour.mealfull || tour.meal}`,
    tour.operatorname && `Оператор: ${tour.operatorname}`,
    tour.price && `Цена: ${formatMoney(tour.price, tour.currency)}`
  ].filter(Boolean).join('\n');
}

function formatRange(range = {}, hotels = []) {
  const hotel = hotelByCode(hotels, range.hotelcode);
  const hotelName = range.hotelname || hotel.hotelname || hotel.name || `hotelcode ${range.hotelcode || 'unknown'}`;
  return [
    `Вариант по отелю: ${hotelName}`,
    range.datefrom && range.dateto && `Даты: ${range.datefrom} — ${range.dateto}`,
    range.nightsfrom && range.nightsto && `Ночей: ${range.nightsfrom}–${range.nightsto}`,
    range.adults !== undefined && `Туристы: ${range.adults} взрослых${range.child ? `, детей: ${range.child}` : ''}`,
    range.pricefrom && `Цена от: ${formatMoney(range.pricefrom, range.currency)}`
  ].filter(Boolean).join('\n');
}

export function normalizeTourvisorCartData(data = {}) {
  const status = data.status || {};
  const info = data.info || {};
  const tours = Array.isArray(data.tours) ? data.tours : [];
  const ranges = Array.isArray(data.ranges) ? data.ranges : [];
  const hotels = Array.isArray(data.hotels) ? data.hotels : [];
  const countries = Array.isArray(data.countries) ? data.countries : [];
  const manager = info.manager || {};

  const chunks = [
    `Источник: Tourvisor cart API`,
    status.cartid && `ID подборки: ${status.cartid}`,
    status.cartdate && `Дата подборки: ${status.cartdate}${status.carttime ? ` ${status.carttime}` : ''}`,
    status.tourscount !== undefined && `Всего вариантов в подборке: ${status.tourscount}`,
    manager.name && `Менеджер: ${manager.name}`,
    countries.length && `Страны: ${countries.map((country) => country.name || country.countryname).filter(Boolean).join(', ')}`,
    tours.length && `\nТочные туры:\n${tours.map((tour, index) => `${index + 1}. ${formatTour(tour, hotels)}`).join('\n\n')}`,
    ranges.length && `\nВарианты/диапазоны по отелям:\n${ranges.map((range, index) => `${index + 1}. ${formatRange(range, hotels)}`).join('\n\n')}`,
    hotels.length && `\nКарточки отелей:\n${hotels.map((hotel, index) => `${index + 1}. ${formatHotel(hotel)}`).join('\n\n')}`
  ].filter(Boolean);

  return chunks.join('\n').replace(/\n{3,}/g, '\n\n').slice(0, 16000);
}

export async function fetchTourvisorCartText(selectionInput = '', options = {}) {
  const cartId = extractTourvisorCartId(selectionInput);
  if (!cartId) return { fetchedText: '', fetchError: '', source: '' };

  const referrer = options.referrer || 'https://teg-tur.ru/podbor-tura';
  const url = `${TOURVISOR_CART_ENDPOINT}?format=json&action=list&cartid=${encodeURIComponent(cartId)}&referrer=${encodeURIComponent(referrer)}&session=`;
  const response = await fetch(url, {
    signal: options.signal,
    headers: {
      'User-Agent': 'T-TRAINER Tourvisor cart analyzer',
      Referer: referrer
    }
  });
  if (!response.ok) throw new Error(`Tourvisor cart API HTTP ${response.status}`);
  const data = await response.json();
  const text = normalizeTourvisorCartData(data);
  if (!text || !/Тур:|Отель:|Вариант по отелю:/i.test(text)) {
    throw new Error(`Tourvisor cart ${cartId} returned no hotel/tour details`);
  }
  return { fetchedText: text, fetchError: '', source: 'tourvisor-cart-api', cartId };
}
