import { mergePortalNavConfig } from '@hoa/shared';
import { parsePortalNavConfig } from './portal-nav';

describe('portal nav config', () => {
  it('defaults optional tabs to disabled', () => {
    const config = parsePortalNavConfig(null);
    expect(config.events).toBe(false);
    expect(config.classifieds).toBe(false);
  });

  it('merges stored config with defaults', () => {
    const config = mergePortalNavConfig({ news: true, voting: true });
    expect(config.news).toBe(true);
    expect(config.voting).toBe(true);
    expect(config.events).toBe(false);
  });
});
