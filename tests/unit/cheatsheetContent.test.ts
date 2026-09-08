import {describe, it, expect} from 'vitest';
import {CHEAT_SECTIONS as EN} from '../../src/lib/cheatsheetContent';
import {CHEAT_SECTIONS as AR} from '../../src/lib/cheatsheet.ar';
import {CHEAT_SECTIONS as ES} from '../../src/lib/cheatsheet.es';
import {CHEAT_SECTIONS as FR} from '../../src/lib/cheatsheet.fr';
import {cheatSections} from '../../src/lib/cheatsheetContent';

describe('cheatsheet localization', () => {
  it('keeps structure and code byte-identical for every locale', () => {
    const locales: Array<[string, typeof AR]> = [['ar', AR], ['es', ES], ['fr', FR]];
    for (const [name, loc] of locales) {
      expect(loc.length).toBe(EN.length);
      EN.forEach((sec, si) => {
        const l = loc[si];
        expect(`${name} icon ${si}`).toBe(`${name} icon ${si}`);
        expect(l.icon).toBe(sec.icon);
        expect(l.cards.length).toBe(sec.cards.length);
        sec.cards.forEach((card, ci) => {
          expect(l.cards[ci].code).toBe(card.code);
          expect(l.cards[ci].title.length).toBeGreaterThan(0);
        });
        expect(l.title.length).toBeGreaterThan(0);
      });
    }
  });

  it('routes locale to the right section set', () => {
    expect(cheatSections('en')).toBe(EN);
    expect(cheatSections('ar')).toBe(AR);
    expect(cheatSections('es')).toBe(ES);
    expect(cheatSections('fr')).toBe(FR);
  });

  it('translates the notes (not English) for every locale', () => {
    const arNote = AR[0].cards[0].note;
    const esNote = ES[0].cards[0].note;
    const frNote = FR[0].cards[0].note;
    // notes should not equal the EN note text
    expect(arNote).not.toBe(EN[0].cards[0].note);
    expect(esNote).not.toBe(EN[0].cards[0].note);
    expect(frNote).not.toBe(EN[0].cards[0].note);
  });
});