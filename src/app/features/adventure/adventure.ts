import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  PLATFORM_ID,
  AfterViewInit,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { GameEngineService } from './game-engine';

@Component({
  selector: 'app-adventure',
  imports: [],
  templateUrl: './adventure.html',
  providers: [GameEngineService],
})
export class AdventureComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scene') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('textLayer') private textLayerRef!: ElementRef<HTMLCanvasElement>;

  protected engine = inject(GameEngineService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private resizeObserver: ResizeObserver | null = null;

  private onKeyDown = (e: KeyboardEvent) => {
    const nav = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'Escape'];
    if (nav.includes(e.code)) e.preventDefault();
    this.engine.keysPressed.add(e.code);
    if ((e.code === 'Space' || e.code === 'Enter') && this.engine.nearbyRefuge()) {
      this.enterRefuge();
    }
    if (e.code === 'Escape') this.engine.keysPressed.clear();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.engine.keysPressed.delete(e.code);
  };

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    const textCanvas = this.textLayerRef.nativeElement;
    const { x, y } = this.engine.restorePosition();
    this.engine.start(this.canvasRef.nativeElement, textCanvas, x, y);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.engine.resize(textCanvas));
      this.resizeObserver.observe(textCanvas);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.engine.stop();
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    }
  }

  protected enterRefuge(): void {
    const refuge = this.engine.nearbyRefuge();
    if (!refuge) return;
    this.engine.savePosition();
    this.router.navigate([refuge.route]);
  }
}
