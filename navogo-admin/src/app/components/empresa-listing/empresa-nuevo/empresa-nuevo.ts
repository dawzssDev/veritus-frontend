import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
// Material
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// ----------------------------------------------------------------------
// 1. IMPORTACIÓN FALTANTE:
import { MatOptionModule } from '@angular/material/core';

// Library's external
import Swal from 'sweetalert2';
import { Empresas } from '../../../services/empresas/empresas';
import { LocationPickerDialogComponent } from '../../location-picker-dialog/location-picker-dialog.component';

@Component({
  selector: 'app-empresa-nuevo',
  imports: [
    MatButtonModule,
    ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatSelectModule,
    MatOptionModule, MatCardModule, MatSlideToggleModule, CommonModule,
    LocationPickerDialogComponent
  ],
  templateUrl: './empresa-nuevo.html',
  styleUrl: './empresa-nuevo.css',
})
export class EmpresaNuevo {
  providersArray: any[] = [];

  form: FormGroup;
  id: number = 0;
  isActive: boolean = true;
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  currentImageUrl: string | null = null;
  empresaData: any = null;
  
  // Diálogo de ubicación
  showLocationPicker = false;
  selectedLatitude: number | null = null;
  selectedLongitude: number | null = null;

  title: string = 'Agregar Nueva Empresa';
  nameButton: string = 'Agregar Empresa';
  pageSubtitle: string = 'Registra la información de la empresa';

  readonly diasSemana: Array<{ key: string; label: string }> = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
  ];

  constructor(private fb: FormBuilder,
    private empresaService: Empresas,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    @Optional() private dialogRef?: MatDialogRef<EmpresaNuevo>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: { id?: number }
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      telefono: [''],
      direccion: ['', Validators.required],
      latitud: [''],
      longitud: [''],
      horarios: this.fb.group({
        lunes: this.fb.group({ is_open: [true], open: ['09:00'], close: ['18:00'] }),
        martes: this.fb.group({ is_open: [true], open: ['09:00'], close: ['18:00'] }),
        miercoles: this.fb.group({ is_open: [true], open: ['09:00'], close: ['18:00'] }),
        jueves: this.fb.group({ is_open: [true], open: ['09:00'], close: ['18:00'] }),
        viernes: this.fb.group({ is_open: [true], open: ['09:00'], close: ['20:00'] }),
        sabado: this.fb.group({ is_open: [true], open: ['10:00'], close: ['23:59'] }),
        domingo: this.fb.group({ is_open: [true], open: ['09:00'], close: ['23:59'] }),
      }),
      pago_efectivo: [1],
      pago_tarjeta: [0],
      pago_transferencia: [0],
      titular: [''],
      banco: [''],
      clabe: [''],
      estatus: [1]
    });

    // Validación condicional: si transferencia está activa, los datos son obligatorios
    this.form.get('pago_transferencia')?.valueChanges.subscribe(() => {
      this.syncTransferValidators();
    });
    this.syncTransferValidators();

    const dialogId = Number(this.data?.id);
    const routeId = Number(this.route.snapshot.paramMap.get('id'));
    this.id = !isNaN(dialogId) && dialogId > 0
      ? dialogId
      : (!isNaN(routeId) && routeId > 0 ? routeId : 0);

    if (this.id > 0) {
      this.get();
      this.title = 'Editar Empresa';
      this.nameButton = 'Guardar Cambios';
    }

  }

  ngOnInit(): void {

  }

  get(): void {
    this.empresaService.getById(this.id).subscribe((res: any) => {
      this.providersArray = res;
      this.empresaData = res;

      // Cargar imagen actual si existe
      if (res?.imagen_url) {
        this.currentImageUrl = res.imagen_url;
      }

      const pagoEfectivo = Number(res?.pago_efectivo);
      const pagoTarjeta = Number(res?.pago_tarjeta);
      const pagoTransferencia = Number(res?.pago_transferencia);

      const horariosRaw = (res as any)?.horarios;
      const horariosParsed = this.parseHorarios(horariosRaw);

      this.form.patchValue({
        nombre: res.nombre,
        descripcion: res.descripcion,
        telefono: res.telefono || '',
        direccion: res.direccion,
        latitud: res.latitud || '',
        longitud: res.longitud || '',
        pago_efectivo: Number.isFinite(pagoEfectivo) ? pagoEfectivo : 0,
        pago_tarjeta: Number.isFinite(pagoTarjeta) ? pagoTarjeta : 0,
        pago_transferencia: Number.isFinite(pagoTransferencia) ? pagoTransferencia : 0,
        titular: (res?.titular ?? '').toString(),
        banco: (res?.banco ?? '').toString(),
        clabe: (res?.clabe ?? '').toString(),
      });

      // Cargar coordenadas si existen
      if (res.latitud && res.longitud) {
        this.selectedLatitude = parseFloat(res.latitud);
        this.selectedLongitude = parseFloat(res.longitud);
      }

      this.syncTransferValidators();

      if (horariosParsed) {
        this.form.get('horarios')?.patchValue(horariosParsed);
      }
    })
  }

  isDayOpen(dayKey: string): boolean {
    return !!this.form.get(['horarios', dayKey, 'is_open'])?.value;
  }

  isTransferActive(): boolean {
    return Number(this.form.get('pago_transferencia')?.value) === 1;
  }

  private syncTransferValidators(): void {
    const active = this.isTransferActive();

    const titularCtrl = this.form.get('titular');
    const bancoCtrl = this.form.get('banco');
    const clabeCtrl = this.form.get('clabe');

    if (active) {
      titularCtrl?.setValidators([Validators.required]);
      bancoCtrl?.setValidators([Validators.required]);
      clabeCtrl?.setValidators([Validators.required]);
    } else {
      titularCtrl?.clearValidators();
      bancoCtrl?.clearValidators();
      clabeCtrl?.clearValidators();
    }

    titularCtrl?.updateValueAndValidity({ emitEvent: false });
    bancoCtrl?.updateValueAndValidity({ emitEvent: false });
    clabeCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private parseHorarios(raw: unknown): any | null {
    if (!raw) return null;

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch {
        return null;
      }
    }

    if (typeof raw === 'object') {
      return raw as any;
    }

    return null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Crear vista previa
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  getDisplayImageUrl(): string | null {
    if (this.imagePreviewUrl) {
      return this.imagePreviewUrl;
    }
    return this.currentImageUrl;
  }

  openLocationPicker(): void {
    this.showLocationPicker = true;
  }

  onLocationSaved(location: { lat: number; lng: number }): void {
    this.selectedLatitude = location.lat;
    this.selectedLongitude = location.lng;
    this.form.patchValue({
      latitud: location.lat.toString(),
      longitud: location.lng.toString()
    });
    
    // Geocodificación inversa para obtener la dirección automáticamente
    this.getAddressFromCoordinates(location.lat, location.lng);
  }

  private getAddressFromCoordinates(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    
    this.http.get<any>(url, {
      headers: {
        'Accept-Language': 'es'
      }
    }).subscribe({
      next: (response) => {
        if (response && response.display_name) {
          // Actualizar el campo de dirección con la dirección obtenida
          this.form.patchValue({
            direccion: response.display_name
          });
          
          // Mostrar un mensaje de éxito
          Swal.fire({
            title: 'Ubicación actualizada',
            text: 'La dirección se ha obtenido automáticamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      },
      error: (error) => {
        console.error('Error al obtener la dirección:', error);
        // Si falla, el usuario puede ingresar la dirección manualmente
        Swal.fire({
          title: 'Aviso',
          text: 'No se pudo obtener la dirección automáticamente. Por favor, ingrésala manualmente.',
          icon: 'info',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  getLocationText(): string {
    if (this.selectedLatitude && this.selectedLongitude) {
      return `📍 ${this.selectedLatitude.toFixed(6)}, ${this.selectedLongitude.toFixed(6)}`;
    }
    return 'No se ha seleccionado ubicación';
  }

  submitType(): void {
    this.isActive = false;
    if (this.id > 0) {
      this.onUpdate()
    } else {
      this.onSubmit()
    }
  }

  cancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      return;
    }
    this.router.navigate(['/empresas']);
  }

  onSubmit(): void {
    // if (this.form.valid) {
    const formData = new FormData();

    // Agrega todos los campos del formulario
    Object.entries(this.form.value).forEach(([key, value]) => {
      if (key === 'horarios') {
        formData.append('horarios', JSON.stringify(value ?? {}));
        return;
      }
      formData.append(key, value as any);
    });

    // Agrega la imagen seleccionada
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    this.empresaService.post(formData).subscribe(
      response => {
        Swal.fire({
          title: 'Éxito',
          text: '¡Empresa creada correctamente!',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          if (this.id > 0 || this.route.snapshot.paramMap.has('id')) {
            this.router.navigate(['/empresas']);
            return;
          }
          window.location.reload();
        });
      },
      error => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo crear la empresa.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    );
    // }
  }


  onUpdate(): void {
    if (this.form.valid) {
      const formData = new FormData();

      // Agrega el ID
      formData.append('id', this.id.toString());

      // Agrega todos los campos del formulario
      Object.entries(this.form.value).forEach(([key, value]) => {
        if (key === 'horarios') {
          formData.append('horarios', JSON.stringify(value ?? {}));
          return;
        }
        formData.append(key, value as any);
      });

      // Agrega la imagen seleccionada si existe
      if (this.selectedFile) {
        formData.append('imagen', this.selectedFile);
      }

      this.empresaService.update(this.id, formData).subscribe(
        response => {
          Swal.fire({
            title: 'Éxito',
            text: '¡Registro actualizado con exito!',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          }).then((result) => {
            if (result.isConfirmed) {
              if (this.route.snapshot.paramMap.has('id')) {
                this.router.navigate(['/empresas']);
                return;
              }
              window.location.reload();
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
    }
  }
}
