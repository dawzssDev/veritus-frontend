export interface FacturapiConfig {
  id: number;
  business_id: number;
  facturapi_key?: string;
  facturapi_org_id: string | null;
  rfc: string;
  razon_social: string;
  regimen_fiscal: string;
  codigo_postal: string;
  activo: boolean;
}

export interface Factura {
  id: number;
  business_id: number;
  order_id: number | null;
  facturapi_invoice_id: string;
  uuid: string | null;
  serie: string | null;
  folio_factura: string | null;
  rfc_receptor: string;
  razon_social_receptor: string;
  uso_cfdi: string;
  regimen_fiscal_receptor: string;
  codigo_postal_receptor: string;
  subtotal: string;
  impuestos: string;
  total: string;
  pdf_url: string | null;
  xml_url: string | null;
  estatus: 'valid' | 'cancelled' | 'draft';
  motivo_cancelacion: string | null;
  notas: string | null;
  created_at: string;
  orden?: { id: number; total: string; created_at: string };
}

export interface OrdenParaFacturar {
  id: number;
  folio: number;
  customer_name: string;
  total: string;
  payment_method: string;
  created_at: string;
  items: {
    id: number;
    name: string;
    quantity: number;
    unit_price: string;
  }[];
  tiene_factura: boolean;
  factura?: Factura | null;
}

export interface ClienteFiscal {
  id: number;
  business_id: number;
  rfc: string;
  razon_social: string;
  regimen_fiscal: string;
  codigo_postal: string;
  uso_cfdi_default: string;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  created_at: string;
}

export const USOS_CFDI = [
  { value: 'G01', label: 'G01 - Adquisición de mercancias' },
  { value: 'G02', label: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'I01', label: 'I01 - Construcciones' },
  { value: 'I02', label: 'I02 - Mobilario y equipo de oficina' },
  { value: 'I03', label: 'I03 - Equipo de transporte' },
  { value: 'I04', label: 'I04 - Equipo de computo y accesorios' },
  { value: 'I08', label: 'I08 - Otra maquinaria y equipo' },
  { value: 'D01', label: 'D01 - Honorarios médicos y gastos hospitalarios' },
  { value: 'D02', label: 'D02 - Gastos médicos por incapacidad' },
  { value: 'D03', label: 'D03 - Gastos funerales' },
  { value: 'D04', label: 'D04 - Donativos' },
  { value: 'D10', label: 'D10 - Pagos por servicios educativos' },
  { value: 'S01', label: 'S01 - Sin efectos fiscales' },
  { value: 'CP01', label: 'CP01 - Pagos' },
  { value: 'CN01', label: 'CN01 - Nómina' },
];

export const REGIMENES_FISCALES = [
  { value: '601', label: '601 - General de Ley Personas Morales' },
  { value: '603', label: '603 - Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 - Sueldos y Salarios e Ingresos Asimilados' },
  { value: '606', label: '606 - Arrendamiento' },
  { value: '607', label: '607 - Régimen de Enajenación o Adquisición de Bienes' },
  { value: '608', label: '608 - Demás ingresos' },
  { value: '610', label: '610 - Residentes en el Extranjero' },
  { value: '611', label: '611 - Ingresos por Dividendos' },
  { value: '612', label: '612 - Personas Físicas con Actividades Empresariales' },
  { value: '614', label: '614 - Ingresos por intereses' },
  { value: '615', label: '615 - Régimen de los ingresos por obtención de premios' },
  { value: '616', label: '616 - Sin obligaciones fiscales' },
  { value: '620', label: '620 - Sociedades Cooperativas de Producción' },
  { value: '621', label: '621 - Incorporación Fiscal' },
  { value: '622', label: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { value: '623', label: '623 - Opcional para Grupos de Sociedades' },
  { value: '624', label: '624 - Coordinados' },
  { value: '625', label: '625 - Régimen de las Actividades Empresariales con ingresos' },
  { value: '626', label: '626 - Régimen Simplificado de Confianza' },
];

export const FORMAS_PAGO = [
  { value: '01', label: '01 - Efectivo' },
  { value: '02', label: '02 - Cheque nominativo' },
  { value: '03', label: '03 - Transferencia electrónica' },
  { value: '04', label: '04 - Tarjeta de crédito' },
  { value: '28', label: '28 - Tarjeta de débito' },
  { value: '29', label: '29 - Tarjeta de servicios' },
  { value: '99', label: '99 - Por definir' },
];

export const MOTIVOS_CANCELACION = [
  { value: '01', label: '01 - Comprobante emitido con errores con relación' },
  { value: '02', label: '02 - Comprobante emitido con errores sin relación' },
  { value: '03', label: '03 - No se llevó a cabo la operación' },
  { value: '04', label: '04 - Operación nominativa relacionada en factura global' },
];
