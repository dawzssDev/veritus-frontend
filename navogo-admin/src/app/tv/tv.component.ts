import {
  Component, OnInit, OnDestroy, AfterViewInit,
  inject, signal, computed, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TvService, CategoriaTV, ProductoTV } from './tv.service';

@Component({
  selector:    'app-tv',
  standalone:  true,
  imports:     [CommonModule, DecimalPipe, DatePipe],
  templateUrl: './tv.component.html',
  styleUrls:   ['./tv.component.scss'],
})
export class TvComponent implements OnInit, OnDestroy {
  private svc   = inject(TvService);
  private route = inject(ActivatedRoute);

  @ViewChild('ticker') tickerRef!: ElementRef<HTMLDivElement>;

  categorias      = signal<CategoriaTV[]>([]);
  promoIdx        = signal<number>(0);
  fraseIdx        = signal<number>(0);
  horaActual      = signal<Date>(new Date());
  cargando        = signal<boolean>(true);
  nombreEmpresa   = signal<string>('Menú');
  logoEmpresa     = signal<string | null>(null);

  private timers: any[] = [];

  readonly EMPRESA_ID = +(
    this.route.snapshot.queryParams['empresa'] ?? 1
  );

  readonly FRASES = [
    'La buena comida es la base de la felicidad genuina.',
    'Cada platillo cuenta una historia. Hoy, la tuya.',
    'El sabor que buscabas, aquí te espera.',
    'Bienvenido. Hoy todo está delicioso.',
    'La mejor mesa siempre es donde estás tú.',
    'Cocinado con pasión, servido con orgullo.',
    'Hoy no cocines. Déjanos consentirte.',
  ];

  // Productos con imagen para el panel de destacados
  destacados = computed<ProductoTV[]>(() => {
    const todos: ProductoTV[] = [];
    this.categorias().forEach(c =>
      c.productos.forEach(p => { if (p.imagen) todos.push(p); })
    );
    // Fallback si pocos tienen imagen
    if (todos.length < 3) {
      this.categorias().forEach(c =>
        c.productos.forEach(p => {
          if (!p.imagen && todos.length < 6) todos.push(p);
        })
      );
    }
    return todos.slice(0, 6);
  });

  promoActual = computed(() =>
    this.destacados()[this.promoIdx()] ?? null
  );

  frase = computed(() => this.FRASES[this.fraseIdx()]);

  dotsLen = (n: number) => Array.from({ length: n }, (_, i) => i);

  ngOnInit(): void {
    this.cargar();

    // Reloj cada segundo
    this.timers.push(setInterval(() =>
      this.horaActual.set(new Date()), 1000));

    // Rota promo cada 5s
    this.timers.push(setInterval(() => {
      const n = this.destacados().length;
      if (n) this.promoIdx.update(i => (i + 1) % n);
    }, 5000));

    // Rota frase cada 12s
    this.timers.push(setInterval(() =>
      this.fraseIdx.update(i => (i + 1) % this.FRASES.length),
    12000));

    // Recarga catálogo cada 5 min
    this.timers.push(setInterval(() => this.cargar(), 300000));
  }

  ngOnDestroy(): void {
    this.timers.forEach(t => clearInterval(t));
  }

  private iniciarScroll(): void {
    const el = this.tickerRef?.nativeElement;
    if (!el) return;

    const velocidad = 0.5;
    let pos = 0;

    const tick = () => {
      pos += velocidad;
      const mitad = el.scrollHeight / 2;
      if (pos >= mitad) pos = 0;
      el.style.transform = `translateY(-${pos}px)`;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  cargar(): void {
    this.svc.getCatalogo(this.EMPRESA_ID).subscribe({
      next: (res) => {
        this.nombreEmpresa.set(res.empresa ?? 'Menú');
        this.logoEmpresa.set(res.logo ?? null);
        this.categorias.set(res.data ?? []);
        this.cargando.set(false);
        setTimeout(() => this.iniciarScroll(), 600);
      },
      error: () => this.cargando.set(false),
    });
  }
}
