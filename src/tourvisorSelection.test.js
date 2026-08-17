import { describe, expect, it } from 'vitest';
import { extractTourvisorCartId, normalizeTourvisorCartData } from './tourvisorSelection.js';

describe('Tourvisor selection parser', () => {
  it('extracts tvcartid from hash links', () => {
    expect(extractTourvisorCartId('https://teg-tur.ru/podbor-tura#tvcartid=79128389')).toBe('79128389');
    expect(extractTourvisorCartId('tvcartid=12345')).toBe('12345');
  });

  it('converts Tourvisor cart JSON into analyzable text', () => {
    const text = normalizeTourvisorCartData({
      status: { cartid: 79128389, cartdate: '17.08.2026', tourscount: 2 },
      info: { manager: { name: 'Рыжков Егор Николаевич' } },
      countries: [{ name: 'Турция' }],
      hotels: [
        { hotelcode: 71071, hotelname: 'The Nora Hotels Family Club', stars: 5, regionname: 'Аланья', description: 'Семейный отель, пляж рядом.' }
      ],
      tours: [
        {
          hotelcode: 71071,
          countryname: 'Турция',
          departurename: 'Москва',
          flydate: '26.08.2026',
          nights: '6',
          placement: '2 взрослых',
          room: 'family room connection',
          mealfull: 'Все включено',
          operatorname: 'Турплатформа',
          price: '150157',
          currency: 'RUB'
        }
      ]
    });

    expect(text).toContain('Источник: Tourvisor cart API');
    expect(text).toContain('ID подборки: 79128389');
    expect(text).toContain('The Nora Hotels Family Club');
    expect(text).toContain('150 157 RUB');
    expect(text).toContain('Все включено');
  });
});
