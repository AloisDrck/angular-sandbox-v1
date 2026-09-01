// src/app/features/adventure/game-engine.spec.ts
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { GameEngineService } from './game-engine';
import { SPAWN_X, SPAWN_Y } from './scene-data';

describe('GameEngineService — update()', () => {
  let engine: GameEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameEngineService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    engine = TestBed.inject(GameEngineService);
    engine.initPosition(SPAWN_X, SPAWN_Y);
  });

  it('se déplace à droite avec ArrowRight', () => {
    engine.keysPressed.add('ArrowRight');
    engine.update(0.1);
    expect(engine.playerX()).toBeGreaterThan(SPAWN_X);
  });

  it('se déplace à gauche avec ArrowLeft', () => {
    engine.keysPressed.add('ArrowLeft');
    engine.update(0.1);
    expect(engine.playerX()).toBeLessThan(SPAWN_X);
  });

  it('ne sort pas de la borne gauche x=20', () => {
    engine.initPosition(20, 278);
    engine.keysPressed.add('ArrowLeft');
    for (let i = 0; i < 50; i++) engine.update(0.1);
    expect(engine.playerX()).toBeGreaterThanOrEqual(20);
  });

  it('ne sort pas de la borne droite x=480', () => {
    engine.initPosition(470, 100);
    engine.keysPressed.add('ArrowRight');
    for (let i = 0; i < 50; i++) engine.update(0.1);
    expect(engine.playerX()).toBeLessThanOrEqual(480);
  });

  it('clamp Y selon la zone X courante', () => {
    engine.initPosition(50, 100); // zone xMin=20 yMin=165
    engine.update(0.01);
    expect(engine.playerY()).toBeGreaterThanOrEqual(165);
  });

  it("détecte la proximité d'un refuge", () => {
    engine.initPosition(137, 215); // sur Contact
    engine.update(0.01);
    expect(engine.nearbyRefuge()).not.toBeNull();
    expect(engine.nearbyRefuge()?.id).toBe('contact');
  });

  it("n'a pas de refuge proche quand le joueur est loin", () => {
    engine.initPosition(SPAWN_X, SPAWN_Y);
    engine.update(0.01);
    expect(engine.nearbyRefuge()).toBeNull();
  });
});

describe('GameEngineService — position persistence', () => {
  let engine: GameEngineService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [GameEngineService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    engine = TestBed.inject(GameEngineService);
  });

  it('savePosition écrit dans sessionStorage', () => {
    engine.initPosition(150, 200);
    engine.savePosition();
    expect(sessionStorage.getItem('adventure_x')).toBe('150');
    expect(sessionStorage.getItem('adventure_y')).toBe('200');
  });

  it('restorePosition lit depuis sessionStorage', () => {
    sessionStorage.setItem('adventure_x', '220');
    sessionStorage.setItem('adventure_y', '130');
    const pos = engine.restorePosition();
    expect(pos.x).toBe(220);
    expect(pos.y).toBe(130);
  });

  it('restorePosition retourne SPAWN si sessionStorage vide', () => {
    const pos = engine.restorePosition();
    expect(pos.x).toBe(SPAWN_X);
    expect(pos.y).toBe(SPAWN_Y);
  });
});
