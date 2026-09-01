import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { signal } from '@angular/core';
import { AdventureComponent } from './adventure';
import { GameEngineService } from './game-engine';

describe('AdventureComponent', () => {
  let engineStartSpy: ReturnType<typeof vi.fn>;
  let engineStopSpy: ReturnType<typeof vi.fn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEngine: any;

  beforeEach(() => {
    engineStartSpy = vi.fn();
    engineStopSpy = vi.fn();

    mockEngine = {
      start: engineStartSpy,
      stop: engineStopSpy,
      savePosition: vi.fn(),
      restorePosition: vi.fn().mockReturnValue({ x: 55, y: 278 }),
      nearbyRefuge: signal(null),
      bubbleScale: signal(0),
      keysPressed: new Set<string>(),
    };

    TestBed.configureTestingModule({
      imports: [AdventureComponent],
      providers: [provideRouter([]), { provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.overrideComponent(AdventureComponent, {
      set: {
        providers: [{ provide: GameEngineService, useValue: mockEngine }],
      },
    });
  });

  it('démarre le moteur après init du canvas', () => {
    const fixture = TestBed.createComponent(AdventureComponent);
    fixture.detectChanges();
    expect(engineStartSpy).toHaveBeenCalled();
  });

  it('arrête le moteur à la destruction', () => {
    const fixture = TestBed.createComponent(AdventureComponent);
    fixture.detectChanges();
    fixture.destroy();
    expect(engineStopSpy).toHaveBeenCalled();
  });
});
