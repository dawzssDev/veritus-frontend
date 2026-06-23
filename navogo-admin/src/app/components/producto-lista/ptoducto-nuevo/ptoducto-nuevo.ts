import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
// Material
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// ----------------------------------------------------------------------
// 1. IMPORTACIÓN FALTANTE:
import { MatOptionModule } from '@angular/material/core';

// Library's external
import Swal from 'sweetalert2';
import { ImportarCatalogoDialogComponent } from '../../../catalogo-complementos/dialogs/importar-catalogo-dialog.component';
import { Productos } from '../../../services/productos/productos';
import { Categorias } from '../../../services/categorias/categorias';
import { AuthService } from '../../../services/auth/auth.service';
import { ProductAdicionalGroup, ProductAdicionalOption, ProductDetail } from '../../../models/business.interface';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

type AdicionalOptionForm = FormGroup<{
  extra: FormControl<string>;
  precio: FormControl<number | null>;
  precioExtra: FormControl<number | null>;
  estatus: FormControl<boolean>;
}>;

type AdicionalGroupForm = FormGroup<{
  catalogo_id: FormControl<number | null>;
  titulo: FormControl<string>;
  opciones: FormArray<AdicionalOptionForm>;
}>;

@Component({
  selector: 'app-ptoducto-nuevo',
  imports: [
    MatButtonModule,
    ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatSelectModule,
    MatOptionModule, MatCardModule, MatSlideToggleModule, CommonModule,
    MatDatepickerModule, MatNativeDateModule, MatDialogModule,
  ],
  templateUrl: './ptoducto-nuevo.html',
  styleUrl: './ptoducto-nuevo.css',
})
export class PtoductoNuevo {
  private dialog = inject(MatDialog);

  providersArray: any[] = [];
  categoriasArray: any[] = [];
  categoriaBusqueda = '';

  get categoriasFiltradas(): any[] {
    if (!this.categoriaBusqueda) return this.categoriasArray;
    const q = this.categoriaBusqueda.toLowerCase();
    return this.categoriasArray.filter(c => c.nombre.toLowerCase().includes(q));
  }

  private readonly subscriptions = new Subscription();

  private lockedEmpresaId: number | null = null;

  form: FormGroup;
  id: number = 0;
  isActive: boolean = true;
  selectedFile: File | null = null;

  currentImageUrl: string = '';
  imagePreviewUrl: string | null = null;

  title: string = 'Crear producto';
  nameButton: string = 'Guardar';

  constructor(
    private fb: FormBuilder,
    private productoService: Productos,
    private categoriaService: Categorias,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      empresa_id: ['', Validators.required],
      precio: [0, Validators.required],
      precio_variable: [0],
      // Backend: `descuento` se envía en pesos (calculado a partir del %).
      descuento: [0, [this.optionalNonNegativeNumber()]],
      // UI: porcentaje (0 o >= 1)
      descuento_porcentaje: [0, [this.optionalZeroOrMinOneNumber()]],
      is_combo: [0, [Validators.required, Validators.min(0), Validators.max(1)]],
      estatus: [true],
      categoria: ['', Validators.required],
      is_promo: [0, [Validators.required, Validators.min(0), Validators.max(1)]],
      fecha_inicio_promo: [''],
      fecha_fin_promo: [''],
      is_recurrente: [null, []],
      dias_promo:    [[], []],
      adicionales: this.fb.array<AdicionalGroupForm>([]),
    });

    this.subscriptions.add(this.form.controls['precio'].valueChanges.subscribe(() => this.syncDescuentoPesos()));
    this.subscriptions.add(this.form.controls['descuento_porcentaje'].valueChanges.subscribe(() => this.syncDescuentoPesos()));
    this.subscriptions.add(this.form.controls['is_promo'].valueChanges.subscribe(() => this.syncPromoValidators()));
    this.syncDescuentoPesos();
    this.syncPromoValidators();

    this.getCategorias();
  }

  ngOnInit(): void {
    // Siempre: la empresa viene del usuario logueado
    this.lockedEmpresaId = this.authService.getEmpresaId();
    if (!this.lockedEmpresaId || this.lockedEmpresaId <= 0) {
      Swal.fire({
        title: 'Empresa no encontrada',
        text: 'No se pudo determinar la empresa del usuario autenticado. Vuelve a iniciar sesión o contacta a soporte.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        this.router.navigate(['/productos']);
      });
      return;
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedId = idParam != null ? Number(idParam) : 0;
    if (Number.isFinite(parsedId) && parsedId > 0) {
      this.id = parsedId;
      this.title = 'Editar producto';
      this.nameButton = 'Guardar cambios';
      this.get();
      return;
    }

    // Crear: setear empresa_id automáticamente
    this.form.patchValue({ empresa_id: this.lockedEmpresaId });
  }

  getCategorias(): void {
    this.categoriaService.get().subscribe((res: any) => {
      this.categoriasArray = res;
    })
  }

  get(): void {
    this.productoService.getById(this.id).subscribe((res: ProductDetail | any) => {
      this.providersArray = res;

      // Imagen actual (preferir imagen_url)
      this.currentImageUrl = this.buildProductImageUrl(res);
      this.imagePreviewUrl = null;
      this.selectedFile = null;

      const precio = Number(res?.precio ?? 0);
      const descuentoPesos = Number(res?.descuento ?? 0);
      const descuentoPorcentaje = precio > 0 && descuentoPesos > 0
        ? Number(((descuentoPesos / precio) * 100).toFixed(2))
        : 0;

      const estatusBool = this.coerceBoolean(res?.estatus, true);

      // Convertir fechas de string a Date para el datepicker
      const fechaInicio = res?.fecha_inicio_promo ? new Date(res.fecha_inicio_promo) : null;
      const fechaFin = res?.fecha_fin_promo ? new Date(res.fecha_fin_promo) : null;

      this.form.patchValue({
        nombre: res?.nombre ?? '',
        descripcion: res?.descripcion ?? '',
        precio: res?.precio ?? 0,
        precio_variable: res?.precio_variable ?? 0,
        descuento: res?.descuento ?? 0,
        descuento_porcentaje: descuentoPorcentaje,
        is_combo: res?.is_combo ?? 0,
        estatus: estatusBool,
        categoria: res?.categoria ?? '',
        is_promo: res?.is_promo ?? 0,
        fecha_inicio_promo: fechaInicio,
        fecha_fin_promo: fechaFin,
        is_recurrente: res?.is_recurrente ?? null,
        dias_promo: Array.isArray(res?.dias_promo) ? res.dias_promo : [],
      }, { emitEvent: false });

      // Forzar empresa_id desde el usuario logueado (sin opción de cambiar)
      if (this.lockedEmpresaId && this.lockedEmpresaId > 0) {
        this.form.patchValue({ empresa_id: this.lockedEmpresaId });
      }

      this.hydrateAdicionales(res?.adicionales ?? []);
    })
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private syncDescuentoPesos(): void {
    const precio = Number(this.form.controls['precio']?.value ?? 0);
    const pct = Number(this.form.controls['descuento_porcentaje']?.value ?? 0);

    if (!Number.isFinite(precio) || !Number.isFinite(pct) || precio <= 0 || pct <= 0) {
      this.form.controls['descuento'].setValue(0, { emitEvent: false });
      return;
    }

    const pesos = Number((precio * (pct / 100)).toFixed(2));
    this.form.controls['descuento'].setValue(pesos, { emitEvent: false });
  }

  isPromoActive(): boolean {
    return Number(this.form.get('is_promo')?.value) === 1;
  }

  isPrecioVariable(): boolean {
    return Number(
      this.form.get('precio_variable')?.value
    ) === 1;
  }

  isRecurrenteActivo(): boolean {
    return Number(this.form.get('is_recurrente')?.value) === 1;
  }

  readonly diasSemana = [
    { valor: 1, label: 'Lunes'     },
    { valor: 2, label: 'Martes'    },
    { valor: 3, label: 'Miércoles' },
    { valor: 4, label: 'Jueves'    },
    { valor: 5, label: 'Viernes'   },
    { valor: 6, label: 'Sábado'    },
    { valor: 0, label: 'Domingo'   },
  ];

  toggleDia(dia: number): void {
    const actual: number[] = this.form.get('dias_promo')?.value ?? [];
    const nuevo = actual.includes(dia)
      ? actual.filter(d => d !== dia)
      : [...actual, dia];
    this.form.get('dias_promo')?.setValue(nuevo);
  }

  isDiaSeleccionado(dia: number): boolean {
    const actual: number[] = this.form.get('dias_promo')?.value ?? [];
    return actual.includes(dia);
  }

  private syncPromoValidators(): void {
    const active = this.isPromoActive();

    const fechaInicioCtrl = this.form.get('fecha_inicio_promo');
    const fechaFinCtrl = this.form.get('fecha_fin_promo');

    if (active) {
      fechaInicioCtrl?.setValidators([Validators.required]);
      fechaFinCtrl?.setValidators([Validators.required]);
    } else {
      fechaInicioCtrl?.clearValidators();
      fechaFinCtrl?.clearValidators();
      this.form.get('is_recurrente')?.setValue(null);
      this.form.get('dias_promo')?.setValue([]);
    }

    fechaInicioCtrl?.updateValueAndValidity({ emitEvent: false });
    fechaFinCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private coerceBoolean(input: any, fallback: boolean): boolean {
    if (input === true || input === false) return input;
    if (input == null) return fallback;
    const s = String(input).trim().toLowerCase();
    if (s === '1' || s === 'true' || s === 'activo') return true;
    if (s === '0' || s === 'false' || s === 'inactivo') return false;
    return fallback;
  }

  getDisplayImageUrl(): string {
    return (this.imagePreviewUrl ?? this.currentImageUrl ?? '').toString();
  }

  private buildProductImageUrl(res: any): string {
    const imagenUrl = (res?.imagen_url ?? '').toString().trim();
    if (imagenUrl) return imagenUrl;

    const imagen = (res?.imagen ?? '').toString().trim();
    if (!imagen) return '';
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) return imagen;
    return `${environment.storageUrl}/${imagen}`;
  }

  // ------------------------------
  // Adicionales (títulos -> opciones)
  // ------------------------------

  get adicionalesArray(): FormArray<AdicionalGroupForm> {
    return this.form.get('adicionales') as FormArray<AdicionalGroupForm>;
  }

  groupAt(index: number): AdicionalGroupForm {
    return this.adicionalesArray.at(index) as AdicionalGroupForm;
  }

  optionsAt(groupIndex: number): FormArray<AdicionalOptionForm> {
    return this.groupAt(groupIndex).controls.opciones;
  }

  addAdicionalGroup(seed?: Partial<ProductAdicionalGroup>, catalogoId?: number | null): void {
    const resolvedCatalogoId =
      catalogoId ??
      (typeof seed?.catalogo_id === 'number' ? seed.catalogo_id : null) ??
      (typeof seed?.id === 'number' ? seed.id : null);

    const group = this.fb.group(
      {
        catalogo_id: this.fb.control<number | null>(resolvedCatalogoId),
        titulo: this.fb.nonNullable.control((seed?.titulo ?? '').toString(), [Validators.required, Validators.minLength(2)]),
        opciones: this.fb.array<AdicionalOptionForm>([]),
      },
      { validators: [this.groupValidator()] }
    ) as AdicionalGroupForm;

    this.adicionalesArray.push(group);

    const opciones = Array.isArray(seed?.opciones) ? seed!.opciones : [];
    if (opciones.length > 0) {
      for (const opt of opciones) this.addAdicionalOption(this.adicionalesArray.length - 1, opt);
      // Si ninguna viene activa, activar la primera para evitar estados ambiguos.
      const anyActive = this.optionsAt(this.adicionalesArray.length - 1).controls.some((c) => !!c.controls.estatus.value);
      if (!anyActive && this.optionsAt(this.adicionalesArray.length - 1).length > 0) {
        this.optionsAt(this.adicionalesArray.length - 1).at(0).controls.estatus.setValue(true);
      }
    } else {
      // UX: arrancar con 1 opción para guiar.
      this.addAdicionalOption(this.adicionalesArray.length - 1);
      this.optionsAt(this.adicionalesArray.length - 1).at(0).controls.estatus.setValue(true);
    }

    group.updateValueAndValidity({ emitEvent: false });
  }

  removeAdicionalGroup(groupIndex: number): void {
    this.adicionalesArray.removeAt(groupIndex);
    this.adicionalesArray.markAsDirty();
  }

  addAdicionalOption(groupIndex: number, seed?: Partial<ProductAdicionalOption>): void {
    const option = this.fb.group({
      extra: this.fb.nonNullable.control((seed?.extra ?? '').toString(), [Validators.required, Validators.minLength(1)]),
      precio: this.fb.control<number | null>(
        seed && (seed as any).precio != null ? Number((seed as any).precio) : null,
        [this.optionalNonNegativeNumber()]
      ),
      precioExtra: this.fb.control<number | null>(
        seed && (seed as any)['precio-extra'] != null ? Number((seed as any)['precio-extra']) : null,
        [this.optionalNonNegativeNumber()]
      ),
      estatus: this.fb.nonNullable.control(!!seed?.estatus),
    }) as AdicionalOptionForm;

    this.optionsAt(groupIndex).push(option);

    // Si es la primera opción, activarla por defecto.
    if (this.optionsAt(groupIndex).length === 1) {
      option.controls.estatus.setValue(true, { emitEvent: false });
    }

    this.groupAt(groupIndex).updateValueAndValidity({ emitEvent: false });
  }

  removeAdicionalOption(groupIndex: number, optionIndex: number): void {
    const opts = this.optionsAt(groupIndex);
    opts.removeAt(optionIndex);

    // Si queda sin ninguna activa pero sí hay opciones, activar la primera.
    const stillHasOptions = opts.length > 0;
    const anyActive = opts.controls.some((c) => !!c.controls.estatus.value);
    if (stillHasOptions && !anyActive) {
      opts.at(0).controls.estatus.setValue(true, { emitEvent: false });
    }

    this.groupAt(groupIndex).updateValueAndValidity({ emitEvent: false });
  }

  onImportar(gruposSeleccionados: ProductAdicionalGroup[]): void {
    gruposSeleccionados.forEach((grupo) => {
      const catalogoId =
        typeof grupo.catalogo_id === 'number'
          ? grupo.catalogo_id
          : typeof grupo.id === 'number'
            ? grupo.id
            : null;
      this.addAdicionalGroup(
        { titulo: grupo.titulo, opciones: grupo.opciones },
        catalogoId
      );
    });
  }

  abrirCatalogo(): void {
    const ref = this.dialog.open(ImportarCatalogoDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'importar-catalogo-dialog-panel',
      autoFocus: false,
      restoreFocus: true,
    });

    ref.afterClosed().subscribe((seleccionados: ProductAdicionalGroup[] | null) => {
      if (seleccionados?.length) {
        this.onImportar(seleccionados);
      }
    });
  }

  private hydrateAdicionales(input: ProductAdicionalGroup[] | any): void {
    this.adicionalesArray.clear();
    const groups = Array.isArray(input) ? input : [];
    for (const g of groups) {
      this.addAdicionalGroup(g, g.catalogo_id ?? null);
    }
  }

  private toAdicionalesJson(): ProductAdicionalGroup[] {
    const groups = this.adicionalesArray.controls;
    return groups
      .map((g) => {
        const titulo = (g.controls.titulo.value ?? '').toString().trim();
        const opciones = g.controls.opciones.controls
          .map((o) => {
            const extra = (o.controls.extra.value ?? '').toString().trim();
            const rawPrecio = o.controls.precio.value;
            const precio = rawPrecio == null ? null : Number(rawPrecio);
            const rawPrecioExtra = o.controls.precioExtra.value;
            const precioExtra = rawPrecioExtra == null ? null : Number(rawPrecioExtra);

            const base: ProductAdicionalOption = {
              extra,
              estatus: !!o.controls.estatus.value,
            };

            if (precio != null && Number.isFinite(precio)) {
              base.precio = precio;
            }

            if (precioExtra != null && Number.isFinite(precioExtra)) {
              base['precio-extra'] = precioExtra;
            }

            return base;
          })
          .filter((o) => (o.extra ?? '').toString().trim().length > 0);

        return {
          catalogo_id: g.controls.catalogo_id.value ?? null,
          titulo,
          opciones,
        };
      })
      .filter((g) => (g.titulo ?? '').toString().trim().length > 0 && Array.isArray(g.opciones) && g.opciones.length > 0);
  }

  private groupValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = control as AdicionalGroupForm;
      const opciones = group?.controls?.opciones;
      const len = opciones?.length ?? 0;
      if (len <= 0) return { noOptions: true };
      const anyActive = (opciones?.controls ?? []).some((c: any) => !!c?.controls?.estatus?.value);
      if (!anyActive) return { invalidDefault: true };
      return null;
    };
  }

  private optionalNonNegativeNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = control.value;
      if (v === '' || v == null) return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return { number: true };
      if (n < 0) return { min: true };
      return null;
    };
  }

  private optionalZeroOrMinOneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = control.value;
      if (v === '' || v == null) return null;
      const n = Number(v);
      if (!Number.isFinite(n)) return { number: true };
      if (n < 0) return { min: true };
      if (n > 0 && n < 1) return { minOne: true };
      return null;
    };
  }

  private formatDateForBackend(date: any): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl =
        typeof reader.result === 'string'
          ? reader.result
          : null;

      // Forzar detección de cambios — el FileReader
      // ejecuta el callback fuera del ciclo de Angular
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  submitType(): void {
    this.isActive = false;
    this.form.markAllAsTouched();
    if (this.id > 0) {
      this.onUpdate()
    } else {
      this.onSubmit()
    }
  }

  onSubmit(): void {
    if (!this.form.valid) {
      Swal.fire({
        title: 'Revisa el formulario',
        text: 'Completa los campos obligatorios y valida los complementos.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      this.isActive = true;
      return;
    }

    const formData = new FormData();

    // Agrega todos los campos del formulario
    Object.entries(this.form.value).forEach(([key, value]) => {
      if (key === 'adicionales') return;
      if (key === 'descuento_porcentaje') return;
      if (key === 'estatus') return;
      if (key === 'is_recurrente') return;
      if (key === 'dias_promo') return;
      if (key === 'fecha_inicio_promo' || key === 'fecha_fin_promo') {
        const formattedDate = this.formatDateForBackend(value);
        if (formattedDate) {
          formData.append(key, formattedDate);
        }
        return;
      }
      formData.append(key, value as any);
    });

    // Estatus como 1/0
    formData.append('estatus', this.form.value.estatus ? '1' : '0');

    // is_recurrente y dias_promo
    const isRec = this.form.value.is_recurrente;
    if (isRec !== null && isRec !== undefined) {
      formData.append('is_recurrente', String(isRec));
    }
    if (Number(isRec) === 1) {
      formData.append('dias_promo', JSON.stringify(this.form.value.dias_promo ?? []));
    }

    // Adicionales en JSON (Laravel lo recibe como string dentro de multipart)
    formData.append('adicionales', JSON.stringify(this.toAdicionalesJson()));

    // Agrega la imagen seleccionada
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    this.productoService.post(formData).subscribe(
      response => {
        Swal.fire({
          title: 'Éxito',
          text: '¡Producto creado correctamente!',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.router.navigate(['/productos']);
        });
      },
      error => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo crear el producto.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    );
  }


  onUpdate(): void {
    if (this.form.valid) {
      // Si el usuario seleccionó imagen, enviamos multipart para poder actualizarla.
      if (this.selectedFile) {
        const formData = new FormData();

        Object.entries(this.form.value).forEach(([key, value]) => {
          if (key === 'adicionales') return;
          if (key === 'descuento_porcentaje') return;
          if (key === 'estatus') return;
          if (key === 'is_recurrente') return;
          if (key === 'dias_promo') return;
          if (key === 'fecha_inicio_promo' || key === 'fecha_fin_promo') {
            const formattedDate = this.formatDateForBackend(value);
            if (formattedDate) {
              formData.append(key, formattedDate);
            }
            return;
          }
          formData.append(key, value as any);
        });

        formData.append('estatus', this.form.value.estatus ? '1' : '0');

        // is_recurrente y dias_promo
        const isRec = this.form.value.is_recurrente;
        if (isRec !== null && isRec !== undefined) {
          formData.append('is_recurrente', String(isRec));
        }
        if (Number(isRec) === 1) {
          formData.append('dias_promo', JSON.stringify(this.form.value.dias_promo ?? []));
        }

        formData.append('adicionales', JSON.stringify(this.toAdicionalesJson()));
        formData.append('imagen', this.selectedFile);

        this.productoService.update(this.id, formData).subscribe(
          response => {
            Swal.fire({
              title: 'Éxito',
              text: '¡Registro actualizado con exito!',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            }).then((result) => {
              if (result.isConfirmed) {
                this.router.navigate(['/productos']);
                this.isActive = true;
              }
            });
          },
          error => {
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al registrar, por favor intente nuevamente.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            }).then((result) => {
              if (result.isConfirmed) {
                console.error('El usuario aceptó la alerta de error');
                this.isActive = true;
              }
            });
          }
        );
        return;
      }

      const { descuento_porcentaje, is_recurrente, dias_promo, ...base } = (this.form.value ?? {}) as any;
      const data = {
        ...base,
        id: this.id,
        estatus: this.form.value.estatus ? 1 : 0,
        adicionales: this.toAdicionalesJson(),
        fecha_inicio_promo: this.formatDateForBackend(this.form.value.fecha_inicio_promo),
        fecha_fin_promo: this.formatDateForBackend(this.form.value.fecha_fin_promo),
        ...(is_recurrente !== null && is_recurrente !== undefined ? { is_recurrente } : {}),
        ...(Number(is_recurrente) === 1 ? { dias_promo } : {}),
      }

      this.productoService.update(this.id, data).subscribe(
        response => {
          Swal.fire({
            title: 'Éxito',
            text: '¡Registro actualizado con exito!',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigate(['/productos']);
              this.isActive = true;
            }
          });
        },
        error => {
          Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al registrar, por favor intente nuevamente.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          }).then((result) => {
            if (result.isConfirmed) {
              console.error('El usuario aceptó la alerta de error');
              this.isActive = true;
            }
          });
        }
      );
      return;
    }

    Swal.fire({
      title: 'Revisa el formulario',
      text: 'Completa los campos obligatorios y valida los complementos.',
      icon: 'warning',
      confirmButtonText: 'Aceptar'
    });
    this.isActive = true;
  }

  cancel(): void {
    this.router.navigate(['/productos']);
  }
}
