import './polyfills.server.mjs';
import{a as $,b as Ee}from"./chunk-QWYHPH6G.mjs";import{a as we,b as De}from"./chunk-NDVBGAK2.mjs";import{b as je,c as ke}from"./chunk-KVH7FYNT.mjs";import{a as z,b as A}from"./chunk-ANZ5DDLR.mjs";import"./chunk-54SXTJHT.mjs";import{l as Se}from"./chunk-OOHQQFO7.mjs";import"./chunk-KEGSHVUE.mjs";import"./chunk-GHUGDNOY.mjs";import{a as Te,b as Oe}from"./chunk-7U4ZIWRI.mjs";import{a as B,b as re,c as Me,h as w}from"./chunk-LYPMAPY3.mjs";import{a as K,c as Q,d as Z}from"./chunk-AOH7WJTM.mjs";import{A as Pe,B as ye,D as H,I as L,N as W,P as R,X as G,_ as U,da as X,ga as J,ka as Y}from"./chunk-2ZTRSEH2.mjs";import{R as D,S as j,Y as le,_ as k,ba as I}from"./chunk-7TZ7NQLQ.mjs";import"./chunk-CHYWC2PK.mjs";import{o as ae,p as V,r as S}from"./chunk-MQUD7DSP.mjs";import{$b as ie,Ac as E,Bc as T,Cc as O,Lb as u,Mb as f,Mc as p,Oc as m,Pb as ee,Qb as te,Rb as h,Sb as i,Tb as t,Ub as C,Wc as F,cb as a,da as _,ec as x,gc as g,ia as N,ja as q,nb as oe,sc as b,ta as v,tb as P,tc as Ce,uc as n,vc as M,wc as c,xc as y,yc as he,zc as be}from"./chunk-MZ665JWA.mjs";import"./chunk-FYU4I3VZ.mjs";function He(l,o){if(l&1&&(i(0,"p",9),n(1),t()),l&2){let e=g();a(),M(e.error())}}function Le(l,o){l&1&&C(0,"mat-spinner",13)}function We(l,o){l&1&&(i(0,"mat-icon"),n(1,"lock_open"),t())}var de=class l{dialogRef=_(B);service=_($);fondoInicial=null;notas="";guardando=v(!1);error=v("");abrir(){this.fondoInicial!==null&&(this.guardando.set(!0),this.error.set(""),this.service.abrir({fondo_inicial:this.fondoInicial,notas_apertura:this.notas||void 0}).subscribe({next:o=>{this.guardando.set(!1),this.dialogRef.close(o.data)},error:o=>{this.guardando.set(!1),this.error.set(o?.error?.message??"Error al abrir el turno")}}))}static \u0275fac=function(e){return new(e||l)};static \u0275cmp=P({type:l,selectors:[["app-abrir-turno-dialog"]],decls:28,vars:6,consts:[[1,"dialog-container"],[1,"dialog-header"],[1,"header-icon"],[1,"dialog-content"],[1,"hint"],["appearance","outline",1,"full-width"],["matTextPrefix",""],["matInput","","type","number","inputmode","decimal","min","0","step","0.01","placeholder","0.00","autofocus","",3,"ngModelChange","ngModel"],["matInput","","rows","2","placeholder","Ej. Turno matutino - cajero Juan",3,"ngModelChange","ngModel"],[1,"form-error"],[1,"dialog-actions"],["mat-button","",3,"click","disabled"],["mat-flat-button","",1,"btn-confirmar",3,"click","disabled"],["diameter","18"]],template:function(e,r){e&1&&(i(0,"div",0)(1,"div",1)(2,"mat-icon",2),n(3,"point_of_sale"),t(),i(4,"h2"),n(5,"Abrir turno de caja"),t()(),i(6,"div",3)(7,"p",4),n(8," Cuenta el efectivo con el que inicias el turno antes de registrar ventas. "),t(),i(9,"mat-form-field",5)(10,"mat-label"),n(11,"Fondo inicial"),t(),i(12,"span",6),n(13,"$\xA0"),t(),i(14,"input",7),O("ngModelChange",function(d){return T(r.fondoInicial,d)||(r.fondoInicial=d),d}),t()(),i(15,"mat-form-field",5)(16,"mat-label"),n(17,"Notas (opcional)"),t(),i(18,"textarea",8),O("ngModelChange",function(d){return T(r.notas,d)||(r.notas=d),d}),n(19,"          "),t()(),u(20,He,2,1,"p",9),t(),i(21,"div",10)(22,"button",11),x("click",function(){return r.dialogRef.close()}),n(23," Cancelar "),t(),i(24,"button",12),x("click",function(){return r.abrir()}),u(25,Le,1,0,"mat-spinner",13)(26,We,2,0,"mat-icon"),n(27," Abrir turno "),t()()()),e&2&&(a(14),E("ngModel",r.fondoInicial),a(4),E("ngModel",r.notas),a(2),f(r.error()?20:-1),a(2),h("disabled",r.guardando()),a(2),h("disabled",r.fondoInicial===null||r.guardando()),a(),f(r.guardando()?25:26))},dependencies:[S,U,H,R,L,G,W,w,I,k,j,D,K,Y,X,J,Z,Q,A,z],styles:["[_nghost-%COMP%]{display:block}.dialog-container[_ngcontent-%COMP%]{display:flex;flex-direction:column;max-height:min(90vh,500px)}.dialog-header[_ngcontent-%COMP%]{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(0,0,0,.08)}.dialog-header[_ngcontent-%COMP%]   .header-icon[_ngcontent-%COMP%]{width:26px;height:26px;font-size:26px;color:#0f4d2a}.dialog-header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{margin:0;font-size:18px;font-weight:700}.dialog-content[_ngcontent-%COMP%]{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px}.hint[_ngcontent-%COMP%]{font-size:13px;color:#6b7280;margin:0 0 4px}.full-width[_ngcontent-%COMP%]{width:100%}.form-error[_ngcontent-%COMP%]{color:#dc2626;font-size:13px;margin:0;padding:8px 12px;background:#fef2f2;border-radius:6px}.dialog-actions[_ngcontent-%COMP%]{display:flex;justify-content:flex-end;gap:10px;padding:12px 16px;border-top:1px solid rgba(0,0,0,.08)}.dialog-actions[_ngcontent-%COMP%]   .btn-confirmar[_ngcontent-%COMP%]{background:#0f4d2a;color:#fff;display:flex;align-items:center;gap:6px}"]})};function Re(l,o){if(l&1&&(i(0,"p",12),n(1),t()),l&2){let e=g();a(),M(e.error())}}function Ge(l,o){l&1&&C(0,"mat-spinner",16)}function Ue(l,o){l&1&&(i(0,"mat-icon"),n(1,"save"),t())}var ue=class l{dialogRef=_(B);service=_($);tipo=v("salida");monto=null;motivo="";nota="";guardando=v(!1);error=v("");puedeGuardar(){return!!this.monto&&this.monto>0&&!!this.motivo.trim()}guardar(){this.puedeGuardar()&&(this.guardando.set(!0),this.error.set(""),this.service.registrarMovimiento({tipo:this.tipo(),monto:this.monto,motivo:this.motivo.trim(),nota:this.nota||void 0}).subscribe({next:o=>{this.guardando.set(!1),this.dialogRef.close(o.data)},error:o=>{this.guardando.set(!1),this.error.set(o?.error?.message??"Error al registrar movimiento")}}))}static \u0275fac=function(e){return new(e||l)};static \u0275cmp=P({type:l,selectors:[["app-movimiento-caja-dialog"]],decls:38,vars:11,consts:[[1,"dialog-container"],[1,"dialog-header"],[1,"header-icon"],[1,"dialog-content"],[1,"tipo-toggle"],["type","button",1,"tipo-btn","tipo-btn--entrada",3,"click"],["type","button",1,"tipo-btn","tipo-btn--salida",3,"click"],["appearance","outline",1,"full-width"],["matTextPrefix",""],["matInput","","type","number","inputmode","decimal","min","0.01","step","0.01",3,"ngModelChange","ngModel"],["matInput","","placeholder","Ej. Compra de hielo, fondo extra...",3,"ngModelChange","ngModel"],["matInput","","rows","2",3,"ngModelChange","ngModel"],[1,"form-error"],[1,"dialog-actions"],["mat-button","",3,"click","disabled"],["mat-flat-button","",1,"btn-confirmar",3,"click","disabled"],["diameter","18"]],template:function(e,r){e&1&&(i(0,"div",0)(1,"div",1)(2,"mat-icon",2),n(3,"swap_horiz"),t(),i(4,"h2"),n(5,"Movimiento de caja"),t()(),i(6,"div",3)(7,"div",4)(8,"button",5),x("click",function(){return r.tipo.set("entrada")}),i(9,"mat-icon"),n(10,"add_circle"),t(),n(11," Entrada "),t(),i(12,"button",6),x("click",function(){return r.tipo.set("salida")}),i(13,"mat-icon"),n(14,"remove_circle"),t(),n(15," Salida "),t()(),i(16,"mat-form-field",7)(17,"mat-label"),n(18,"Monto"),t(),i(19,"span",8),n(20,"$\xA0"),t(),i(21,"input",9),O("ngModelChange",function(d){return T(r.monto,d)||(r.monto=d),d}),t()(),i(22,"mat-form-field",7)(23,"mat-label"),n(24,"Motivo"),t(),i(25,"input",10),O("ngModelChange",function(d){return T(r.motivo,d)||(r.motivo=d),d}),t()(),i(26,"mat-form-field",7)(27,"mat-label"),n(28,"Nota (opcional)"),t(),i(29,"textarea",11),O("ngModelChange",function(d){return T(r.nota,d)||(r.nota=d),d}),t()(),u(30,Re,2,1,"p",12),t(),i(31,"div",13)(32,"button",14),x("click",function(){return r.dialogRef.close()}),n(33," Cancelar "),t(),i(34,"button",15),x("click",function(){return r.guardar()}),u(35,Ge,1,0,"mat-spinner",16)(36,Ue,2,0,"mat-icon"),n(37," Registrar "),t()()()),e&2&&(a(8),b("selected",r.tipo()==="entrada"),a(4),b("selected",r.tipo()==="salida"),a(9),E("ngModel",r.monto),a(4),E("ngModel",r.motivo),a(4),E("ngModel",r.nota),a(),f(r.error()?30:-1),a(2),h("disabled",r.guardando()),a(2),h("disabled",!r.puedeGuardar()||r.guardando()),a(),f(r.guardando()?35:36))},dependencies:[S,U,H,R,L,G,W,w,I,k,j,D,K,Y,X,J,Z,Q,A,z],styles:["[_nghost-%COMP%]{display:block}.dialog-container[_ngcontent-%COMP%]{display:flex;flex-direction:column;max-height:min(90vh,560px)}.dialog-header[_ngcontent-%COMP%]{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(0,0,0,.08)}.dialog-header[_ngcontent-%COMP%]   .header-icon[_ngcontent-%COMP%]{width:26px;height:26px;font-size:26px;color:#0f4d2a}.dialog-header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{margin:0;font-size:18px;font-weight:700}.dialog-content[_ngcontent-%COMP%]{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px}.full-width[_ngcontent-%COMP%]{width:100%}.tipo-toggle[_ngcontent-%COMP%]{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px}.tipo-btn[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 10px;border:2px solid #e5e7eb;border-radius:10px;background:#fff;cursor:pointer;font-weight:700;font-size:14px;color:#9ca3af;font-family:inherit;transition:all .15s}.tipo-btn[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:20px;width:20px;height:20px;transition:color .15s}.tipo-btn[_ngcontent-%COMP%]:hover{border-color:#d1d5db;color:#6b7280}.tipo-btn.selected[_ngcontent-%COMP%]{border-color:#16a34a;background:#f0fdf4;color:#16a34a;box-shadow:0 0 0 3px #16a34a26}.tipo-btn.selected[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:#16a34a}.form-error[_ngcontent-%COMP%]{color:#dc2626;font-size:13px;margin:0;padding:8px 12px;background:#fef2f2;border-radius:6px}.dialog-actions[_ngcontent-%COMP%]{display:flex;justify-content:flex-end;gap:10px;padding:12px 16px;border-top:1px solid rgba(0,0,0,.08)}.dialog-actions[_ngcontent-%COMP%]   .btn-confirmar[_ngcontent-%COMP%]{background:#0f4d2a;color:#fff;display:flex;align-items:center;gap:6px}"]})};function Xe(l,o){if(l&1&&(i(0,"div",18)(1,"mat-icon"),n(2),t(),i(3,"span"),n(4),p(5,"number"),t()()),l&2){let e=g();b("diferencia-display--ok",e.diferencia()===0)("diferencia-display--sobrante",e.diferencia()>0)("diferencia-display--faltante",e.diferencia()<0),a(2),c(" ",e.diferencia()===0?"check_circle":e.diferencia()>0?"trending_up":"trending_down"," "),a(2),he(" ",e.diferencia()===0?"Caja cuadrada":e.diferencia()>0?"Sobrante":"Faltante",": ",e.diferencia()>0?"+":"","$",m(5,10,e.diferencia(),"1.2-2")," ")}}function Je(l,o){if(l&1&&(i(0,"p",13),n(1),t()),l&2){let e=g();a(),M(e.error())}}function Ye(l,o){l&1&&C(0,"mat-spinner",17)}function Ke(l,o){l&1&&(i(0,"mat-icon"),n(1,"lock"),t())}var fe=class l{constructor(o){this.data=o}data;dialogRef=_(B);service=_($);guardando=v(!1);error=v("");efectivoContado=null;notas="";fondo=F(()=>Number(this.data.turno.fondo_inicial));ventasEfectivo=F(()=>this.data.turno.metricas_en_vivo?.total_efectivo??Number(this.data.turno.total_efectivo));entradas=F(()=>Number(this.data.turno.total_entradas_caja));salidas=F(()=>Number(this.data.turno.total_salidas_caja));efectivoEsperado=F(()=>Number(this.data.turno.efectivo_esperado)||this.fondo()+this.ventasEfectivo()+this.entradas()-this.salidas());diferenciaValor=v(0);diferencia=F(()=>this.diferenciaValor());onContadoChange(){let o=this.efectivoContado??0;this.diferenciaValor.set(Math.round((o-this.efectivoEsperado())*100)/100)}cerrar(){this.efectivoContado!==null&&(this.guardando.set(!0),this.error.set(""),this.service.cerrar({efectivo_contado:this.efectivoContado,notas_cierre:this.notas||void 0}).subscribe({next:o=>{this.guardando.set(!1),this.dialogRef.close(o.data)},error:o=>{this.guardando.set(!1),this.error.set(o?.error?.message??"Error al cerrar el turno")}}))}static \u0275fac=function(e){return new(e||l)(oe(re))};static \u0275cmp=P({type:l,selectors:[["app-cerrar-turno-dialog"]],decls:38,vars:27,consts:[[1,"dialog-container"],[1,"dialog-header"],[1,"header-icon"],[1,"dialog-content"],[1,"resumen-esperado"],[1,"resumen-label"],[1,"resumen-monto"],[1,"resumen-desglose"],["appearance","outline",1,"full-width"],["matTextPrefix",""],["matInput","","type","number","inputmode","decimal","min","0","step","0.01","autofocus","",3,"ngModelChange","ngModel"],[1,"diferencia-display",3,"diferencia-display--ok","diferencia-display--sobrante","diferencia-display--faltante"],["matInput","","rows","2",3,"ngModelChange","ngModel"],[1,"form-error"],[1,"dialog-actions"],["mat-button","",3,"click","disabled"],["mat-flat-button","",1,"btn-confirmar",3,"click","disabled"],["diameter","18"],[1,"diferencia-display"]],template:function(e,r){e&1&&(i(0,"div",0)(1,"div",1)(2,"mat-icon",2),n(3,"lock"),t(),i(4,"h2"),n(5,"Cerrar turno de caja"),t()(),i(6,"div",3)(7,"div",4)(8,"span",5),n(9,"Efectivo esperado en caja"),t(),i(10,"strong",6),n(11),p(12,"number"),t(),i(13,"span",7),n(14),p(15,"number"),p(16,"number"),p(17,"number"),p(18,"number"),t()(),i(19,"mat-form-field",8)(20,"mat-label"),n(21,"Efectivo contado f\xEDsicamente"),t(),i(22,"span",9),n(23,"$\xA0"),t(),i(24,"input",10),O("ngModelChange",function(d){return T(r.efectivoContado,d)||(r.efectivoContado=d),d}),x("ngModelChange",function(){return r.onContadoChange()}),t()(),u(25,Xe,6,13,"div",11),i(26,"mat-form-field",8)(27,"mat-label"),n(28,"Notas de cierre (opcional)"),t(),i(29,"textarea",12),O("ngModelChange",function(d){return T(r.notas,d)||(r.notas=d),d}),t()(),u(30,Je,2,1,"p",13),t(),i(31,"div",14)(32,"button",15),x("click",function(){return r.dialogRef.close()}),n(33," Cancelar "),t(),i(34,"button",16),x("click",function(){return r.cerrar()}),u(35,Ye,1,0,"mat-spinner",17)(36,Ke,2,0,"mat-icon"),n(37," Cerrar turno "),t()()()),e&2&&(a(11),c(" $",m(12,12,r.efectivoEsperado(),"1.2-2")," "),a(3),be(" Fondo $",m(15,15,r.fondo(),"1.2-2")," + Ventas efectivo $",m(16,18,r.ventasEfectivo(),"1.2-2")," + Entradas $",m(17,21,r.entradas(),"1.2-2")," \u2212 Salidas $",m(18,24,r.salidas(),"1.2-2")," "),a(10),E("ngModel",r.efectivoContado),a(),f(r.efectivoContado!==null?25:-1),a(4),E("ngModel",r.notas),a(),f(r.error()?30:-1),a(2),h("disabled",r.guardando()),a(2),h("disabled",r.efectivoContado===null||r.guardando()),a(),f(r.guardando()?35:36))},dependencies:[S,U,H,R,L,G,W,w,I,k,j,D,K,Y,X,J,Z,Q,A,z,V],styles:["[_nghost-%COMP%]{display:block}.dialog-container[_ngcontent-%COMP%]{display:flex;flex-direction:column;max-height:min(90vh,640px)}.dialog-header[_ngcontent-%COMP%]{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(0,0,0,.08)}.dialog-header[_ngcontent-%COMP%]   .header-icon[_ngcontent-%COMP%]{width:26px;height:26px;font-size:26px;color:#0f4d2a}.dialog-header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{margin:0;font-size:18px;font-weight:700}.dialog-content[_ngcontent-%COMP%]{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px}.full-width[_ngcontent-%COMP%]{width:100%}.resumen-esperado[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:4px;padding:12px 14px;background:#f5f7fa;border-radius:10px}.resumen-label[_ngcontent-%COMP%]{font-size:12px;color:#6b7280;font-weight:600}.resumen-monto[_ngcontent-%COMP%]{font-size:24px;font-weight:800;color:#0f4d2a}.resumen-desglose[_ngcontent-%COMP%]{font-size:11px;color:#9ca3af}.diferencia-display[_ngcontent-%COMP%]{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:8px;font-size:14px;font-weight:700}.diferencia-display--ok[_ngcontent-%COMP%]{background:#dcfce7;color:#166534}.diferencia-display--sobrante[_ngcontent-%COMP%]{background:#dbeafe;color:#1d4ed8}.diferencia-display--faltante[_ngcontent-%COMP%]{background:#fef2f2;color:#dc2626}.form-error[_ngcontent-%COMP%]{color:#dc2626;font-size:13px;margin:0;padding:8px 12px;background:#fef2f2;border-radius:6px}.dialog-actions[_ngcontent-%COMP%]{display:flex;justify-content:flex-end;gap:10px;padding:12px 16px;border-top:1px solid rgba(0,0,0,.08)}.dialog-actions[_ngcontent-%COMP%]   .btn-confirmar[_ngcontent-%COMP%]{background:#0f4d2a;color:#fff;display:flex;align-items:center;gap:6px}"]})};var Qe=(l,o)=>o.id;function Ze(l,o){l&1&&(i(0,"div",5),C(1,"mat-spinner",8),t()),l&2&&(a(),h("diameter",40))}function et(l,o){if(l&1&&(i(0,"span",25)(1,"mat-icon"),n(2,"cancel"),t(),n(3),t()),l&2){let e=g();a(3),c(" ",e.ordenes_canceladas," canceladas ")}}function tt(l,o){if(l&1&&(i(0,"span",39),n(1),t()),l&2){let e=g().$implicit;a(),M(e.nota)}}function it(l,o){if(l&1&&(i(0,"div",36)(1,"mat-icon"),n(2),t(),i(3,"div",37)(4,"span",38),n(5),t(),u(6,tt,2,1,"span",39),i(7,"span",40),n(8),p(9,"date"),t()(),i(10,"span",41),n(11),p(12,"number"),t()()),l&2){let e=o.$implicit;a(),b("icono-entrada",e.tipo==="entrada")("icono-salida",e.tipo==="salida"),a(),c(" ",e.tipo==="entrada"?"add_circle":"remove_circle"," "),a(3),M(e.motivo),a(),f(e.nota?6:-1),a(2),y(" ",m(9,15,e.created_at,"h:mm a")," \xB7 ",(e.usuario==null?null:e.usuario.nombreCompleto)??"\u2014"," "),a(2),b("monto-entrada",e.tipo==="entrada")("monto-salida",e.tipo==="salida"),a(),y(" ",e.tipo==="entrada"?"+":"\u2212"," $",m(12,18,e.monto,"1.2-2")," ")}}function nt(l,o){if(l&1&&(C(0,"mat-divider"),i(1,"div",9)(2,"h3",14)(3,"mat-icon"),n(4,"swap_horiz"),t(),n(5," Movimientos de caja "),t(),i(6,"div",35),ee(7,it,13,21,"div",36,Qe),t()()),l&2){let e=g();a(7),te(e.movimientos)}}function ot(l,o){if(l&1&&(i(0,"p",43)(1,"mat-icon"),n(2,"note"),t(),i(3,"strong"),n(4,"Apertura:"),t(),n(5),t()),l&2){let e=g(2);a(5),c(" ",e.notas_apertura," ")}}function at(l,o){if(l&1&&(i(0,"p",43)(1,"mat-icon"),n(2,"note"),t(),i(3,"strong"),n(4,"Cierre:"),t(),n(5),t()),l&2){let e=g(2);a(5),c(" ",e.notas_cierre," ")}}function rt(l,o){if(l&1&&(C(0,"mat-divider"),i(1,"div",42),u(2,ot,6,1,"p",43),u(3,at,6,1,"p",43),t()),l&2){let e=g();a(2),f(e.notas_apertura?2:-1),a(),f(e.notas_cierre?3:-1)}}function lt(l,o){if(l&1&&(i(0,"div",9)(1,"div",10)(2,"div",11)(3,"span",12),n(4,"Apertura"),t(),i(5,"span",13),n(6),p(7,"date"),t()(),i(8,"div",11)(9,"span",12),n(10,"Cierre"),t(),i(11,"span",13),n(12),p(13,"date"),t()(),i(14,"div",11)(15,"span",12),n(16,"Abri\xF3"),t(),i(17,"span",13),n(18),t()(),i(19,"div",11)(20,"span",12),n(21,"Cerr\xF3"),t(),i(22,"span",13),n(23),t()(),i(24,"div",11)(25,"span",12),n(26,"Duraci\xF3n"),t(),i(27,"span",13),n(28),t()(),i(29,"div",11)(30,"span",12),n(31,"Fondo inicial"),t(),i(32,"span",13),n(33),p(34,"number"),t()()()(),C(35,"mat-divider"),i(36,"div",9)(37,"h3",14)(38,"mat-icon"),n(39,"point_of_sale"),t(),n(40," Ventas "),t(),i(41,"div",15)(42,"div",16)(43,"mat-icon",17),n(44,"payments"),t(),i(45,"div")(46,"span",18),n(47,"Efectivo"),t(),i(48,"span",19),n(49),p(50,"number"),t()()(),i(51,"div",16)(52,"mat-icon",20),n(53,"credit_card"),t(),i(54,"div")(55,"span",18),n(56,"Tarjeta"),t(),i(57,"span",19),n(58),p(59,"number"),t()()(),i(60,"div",16)(61,"mat-icon",21),n(62,"account_balance"),t(),i(63,"div")(64,"span",18),n(65,"Transferencia"),t(),i(66,"span",19),n(67),p(68,"number"),t()()(),i(69,"div",16)(70,"mat-icon",22),n(71,"volunteer_activism"),t(),i(72,"div")(73,"span",18),n(74,"Propinas"),t(),i(75,"span",19),n(76),p(77,"number"),t()()()(),i(78,"div",23)(79,"span"),n(80,"Total ventas del turno"),t(),i(81,"strong"),n(82),p(83,"number"),t()(),i(84,"div",24)(85,"span")(86,"mat-icon"),n(87,"receipt_long"),t(),n(88),t(),u(89,et,4,1,"span",25),t()(),C(90,"mat-divider"),i(91,"div",9)(92,"h3",14)(93,"mat-icon"),n(94,"calculate"),t(),n(95," Arqueo de efectivo "),t(),i(96,"div",26)(97,"div",27)(98,"span"),n(99,"Fondo inicial"),t(),i(100,"span"),n(101),p(102,"number"),t()(),i(103,"div",28)(104,"span"),n(105,"+ Ventas en efectivo"),t(),i(106,"span"),n(107),p(108,"number"),t()(),i(109,"div",28)(110,"span"),n(111,"+ Entradas de caja"),t(),i(112,"span"),n(113),p(114,"number"),t()(),i(115,"div",29)(116,"span"),n(117,"\u2212 Salidas de caja"),t(),i(118,"span"),n(119),p(120,"number"),t()(),i(121,"div",30)(122,"span"),n(123,"Efectivo esperado"),t(),i(124,"span"),n(125),p(126,"number"),t()(),i(127,"div",31)(128,"span"),n(129,"Efectivo contado"),t(),i(130,"span"),n(131),p(132,"number"),t()()(),i(133,"div",32)(134,"mat-icon"),n(135),t(),i(136,"div")(137,"span",33),n(138),t(),i(139,"span",34),n(140),p(141,"number"),t()()()(),u(142,nt,9,0),u(143,rt,4,2)),l&2){let e=o,r=g();a(6),c(" ",m(7,31,e.hora_apertura,"d MMM y, h:mm a")," "),a(6),c(" ",e.hora_cierre?m(13,34,e.hora_cierre,"d MMM y, h:mm a"):"\u2014"," "),a(6),c(" ",(e.usuarioApertura==null?null:e.usuarioApertura.nombreCompleto)??"\u2014"," "),a(5),c(" ",(e.usuarioCierre==null?null:e.usuarioCierre.nombreCompleto)??"\u2014"," "),a(5),c(" ",r.formatDuracion(e.duracion_minutos??0)," "),a(5),c(" $",m(34,37,e.fondo_inicial,"1.2-2")," "),a(16),c(" $",m(50,40,e.total_efectivo,"1.2-2")," "),a(9),c(" $",m(59,43,e.total_tarjeta,"1.2-2")," "),a(9),c(" $",m(68,46,e.total_transferencia,"1.2-2")," "),a(9),c(" $",m(77,49,e.total_propinas,"1.2-2")," "),a(6),c("$",m(83,52,e.total_ventas,"1.2-2")),a(6),c(" ",e.total_ordenes," \xF3rdenes finalizadas "),a(),f((e.ordenes_canceladas??0)>0?89:-1),a(12),c("$",m(102,55,e.fondo_inicial,"1.2-2")),a(6),c("$",m(108,58,e.total_efectivo,"1.2-2")),a(6),c("$",m(114,61,e.total_entradas_caja,"1.2-2")),a(6),c("$",m(120,64,e.total_salidas_caja,"1.2-2")),a(6),c("$",m(126,67,e.efectivo_esperado,"1.2-2")),a(6),c("$",m(132,70,e.efectivo_contado,"1.2-2")),a(2),b("arqueo-resultado--cuadrado",r.getArqueo(e)===0)("arqueo-resultado--sobrante",r.getArqueo(e)>0)("arqueo-resultado--faltante",r.getArqueo(e)<0),a(2),c(" ",r.getArqueo(e)===0?"check_circle":r.getArqueo(e)>0?"trending_up":"trending_down"," "),a(3),c(" ",r.getArqueo(e)===0?"Caja cuadrada":r.getArqueo(e)>0?"Sobrante":"Faltante"," "),a(2),y(" ",r.getArqueo(e)>0?"+":""," $",m(141,73,r.getArqueo(e),"1.2-2")," "),a(2),f(((e.movimientos==null?null:e.movimientos.length)??0)>0?142:-1),a(),f(e.notas_apertura||e.notas_cierre?143:-1)}}var xe=class l{constructor(o){this.data=o}data;dialogRef=_(B);service=_($);turno=v(null);cargando=v(!0);ngOnInit(){this.service.getDetalle(this.data.turnoId).subscribe({next:o=>{this.turno.set(o.data),this.cargando.set(!1)},error:()=>this.cargando.set(!1)})}getArqueo(o){return Math.round(Number(o.diferencia??0)*100)/100}formatDuracion(o){if(!o)return"\u2014";let e=Math.floor(o/60),r=o%60;return e>0?`${e}h ${r}m`:`${r} min`}static \u0275fac=function(e){return new(e||l)(oe(re))};static \u0275cmp=P({type:l,selectors:[["app-detalle-turno-dialog"]],decls:15,vars:2,consts:[[1,"dialog-container"],[1,"dialog-header"],[1,"header-icon"],["mat-icon-button","",1,"btn-cerrar",3,"click"],[1,"dialog-content"],[1,"cargando"],[1,"dialog-actions"],["mat-button","",3,"click"],[3,"diameter"],[1,"seccion"],[1,"turno-info-grid"],[1,"info-item"],[1,"info-label"],[1,"info-valor"],[1,"seccion-titulo"],[1,"desglose-grid"],[1,"desglose-item"],[1,"di-icon","di-icon--efectivo"],[1,"di-label"],[1,"di-valor"],[1,"di-icon","di-icon--tarjeta"],[1,"di-icon","di-icon--transferencia"],[1,"di-icon","di-icon--propina"],[1,"total-ventas-row"],[1,"ordenes-row"],[1,"canceladas"],[1,"arqueo-grid"],[1,"arqueo-fila"],[1,"arqueo-fila","arqueo-fila--positivo"],[1,"arqueo-fila","arqueo-fila--negativo"],[1,"arqueo-fila","arqueo-fila--esperado"],[1,"arqueo-fila","arqueo-fila--contado"],[1,"arqueo-resultado"],[1,"ar-titulo"],[1,"ar-monto"],[1,"movimientos-lista"],[1,"mov-item"],[1,"mov-info"],[1,"mov-motivo"],[1,"mov-nota"],[1,"mov-meta"],[1,"mov-monto"],[1,"seccion","seccion--notas"],[1,"nota-txt"]],template:function(e,r){if(e&1&&(i(0,"div",0)(1,"div",1)(2,"mat-icon",2),n(3,"receipt_long"),t(),i(4,"h2"),n(5,"Detalle de turno"),t(),i(6,"button",3),x("click",function(){return r.dialogRef.close()}),i(7,"mat-icon"),n(8,"close"),t()()(),i(9,"div",4),u(10,Ze,2,1,"div",5),u(11,lt,144,76),t(),i(12,"div",6)(13,"button",7),x("click",function(){return r.dialogRef.close()}),n(14," Cerrar "),t()()()),e&2){let s;a(10),f(r.cargando()?10:-1),a(),f((s=!r.cargando()&&r.turno())?11:-1,s)}},dependencies:[S,w,I,k,le,j,D,A,z,Oe,Te,V,ae],styles:["[_nghost-%COMP%]{display:block}.dialog-container[_ngcontent-%COMP%]{display:flex;flex-direction:column;max-height:min(90vh,720px);width:min(100%,560px);background:var(--color-bg-surface);color:var(--color-text-primary)}.dialog-header[_ngcontent-%COMP%]{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid var(--color-border);background:var(--color-bg-surface);color:var(--color-text-primary);flex-shrink:0}.dialog-header[_ngcontent-%COMP%]   .header-icon[_ngcontent-%COMP%]{width:26px;height:26px;font-size:26px;color:#1c8c40}.dialog-header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{margin:0;font-size:18px;font-weight:700;flex:1;color:var(--color-text-primary)}.dialog-header[_ngcontent-%COMP%]   .btn-cerrar[_ngcontent-%COMP%]{margin-left:auto;color:var(--color-text-muted)}.dialog-content[_ngcontent-%COMP%]{flex:1;overflow-y:auto;padding:0}.cargando[_ngcontent-%COMP%]{display:flex;justify-content:center;padding:40px}.seccion[_ngcontent-%COMP%]{padding:14px 16px}.seccion-titulo[_ngcontent-%COMP%]{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);margin:0 0 12px}.seccion-titulo[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:15px;width:15px;height:15px}.turno-info-grid[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.info-item[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:2px}.info-label[_ngcontent-%COMP%]{font-size:11px;color:var(--color-text-muted);font-weight:600}.info-valor[_ngcontent-%COMP%]{font-size:13px;font-weight:600;color:var(--color-text-primary)}.desglose-grid[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px}.desglose-item[_ngcontent-%COMP%]{display:flex;align-items:center;gap:8px;padding:10px;background:var(--color-bg-surface-2);border:1px solid var(--color-border);border-radius:8px;color:var(--color-text-primary)}.di-icon[_ngcontent-%COMP%]{font-size:18px;width:18px;height:18px}.di-icon--efectivo[_ngcontent-%COMP%]{color:#16a34a}.di-icon--tarjeta[_ngcontent-%COMP%]{color:#7c3aed}.di-icon--transferencia[_ngcontent-%COMP%]{color:#2563eb}.di-icon--propina[_ngcontent-%COMP%]{color:#d97706}.di-label[_ngcontent-%COMP%]{display:block;font-size:10px;color:var(--color-text-muted);font-weight:600}.di-valor[_ngcontent-%COMP%]{display:block;font-size:13px;font-weight:700;color:var(--color-text-primary)}.total-ventas-row[_ngcontent-%COMP%]{display:flex;justify-content:space-between;padding:10px 12px;background:#0f4d2a;border-radius:8px;color:#fff;font-size:14px;font-weight:700;margin-bottom:8px}.ordenes-row[_ngcontent-%COMP%]{display:flex;align-items:center;gap:14px;font-size:12px;color:var(--color-text-muted)}.ordenes-row[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:14px;width:14px;height:14px;vertical-align:middle;margin-right:2px}.canceladas[_ngcontent-%COMP%]{color:#dc2626}.arqueo-grid[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}.arqueo-fila[_ngcontent-%COMP%]{display:flex;justify-content:space-between;font-size:13px;color:var(--color-text-secondary);padding:4px 0}.arqueo-fila--positivo[_ngcontent-%COMP%]{color:#16a34a}.arqueo-fila--negativo[_ngcontent-%COMP%]{color:#dc2626}.arqueo-fila--esperado[_ngcontent-%COMP%]{border-top:1.5px solid var(--color-border);margin-top:4px;padding-top:8px;font-weight:700;color:#1c8c40}.arqueo-fila--contado[_ngcontent-%COMP%]{font-weight:700;color:var(--color-text-primary);font-size:14px}.arqueo-resultado[_ngcontent-%COMP%]{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:10px;font-size:14px;font-weight:700}.arqueo-resultado--cuadrado[_ngcontent-%COMP%]{background:var(--color-success-bg);color:#16a34a}.arqueo-resultado--sobrante[_ngcontent-%COMP%]{background:#2563eb26;color:#60a5fa}.arqueo-resultado--faltante[_ngcontent-%COMP%]{background:var(--color-error-bg);color:#dc2626}.ar-titulo[_ngcontent-%COMP%]{display:block;font-size:12px;opacity:.8}.ar-monto[_ngcontent-%COMP%]{display:block;font-size:18px;font-weight:800}.movimientos-lista[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:6px}.mov-item[_ngcontent-%COMP%]{display:flex;align-items:flex-start;gap:8px;padding:8px 10px;background:var(--color-bg-surface-2);border-radius:8px}.mov-item[_ngcontent-%COMP%]   .icono-entrada[_ngcontent-%COMP%]{color:#16a34a}.mov-item[_ngcontent-%COMP%]   .icono-salida[_ngcontent-%COMP%]{color:#dc2626}.mov-info[_ngcontent-%COMP%]{display:flex;flex-direction:column;flex:1;min-width:0}.mov-motivo[_ngcontent-%COMP%]{font-size:13px;font-weight:600;color:var(--color-text-primary)}.mov-nota[_ngcontent-%COMP%], .mov-meta[_ngcontent-%COMP%]{font-size:11px;color:var(--color-text-muted)}.mov-monto[_ngcontent-%COMP%]{font-size:13px;font-weight:700;flex-shrink:0}.mov-monto.monto-entrada[_ngcontent-%COMP%]{color:#16a34a}.mov-monto.monto-salida[_ngcontent-%COMP%]{color:#dc2626}.seccion--notas[_ngcontent-%COMP%]{background:var(--color-warning-bg)}.nota-txt[_ngcontent-%COMP%]{display:flex;align-items:flex-start;gap:6px;font-size:13px;color:var(--notes-text);margin:0 0 4px}.nota-txt[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:15px;width:15px;height:15px;flex-shrink:0;margin-top:1px}.dialog-actions[_ngcontent-%COMP%]{flex-shrink:0;display:flex;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--color-border);background:var(--color-bg-surface)}"]})};var Ne=(l,o)=>o.id;function dt(l,o){l&1&&(i(0,"div",3),C(1,"mat-spinner",7),t()),l&2&&(a(),h("diameter",48))}function ct(l,o){if(l&1){let e=ie();i(0,"div",8)(1,"div",10)(2,"mat-icon"),n(3,"point_of_sale"),t()(),i(4,"h2"),n(5,"No hay un turno de caja abierto"),t(),i(6,"p"),n(7,"Abre un turno para comenzar a registrar ventas y movimientos de efectivo."),t(),i(8,"button",11),x("click",function(){N(e);let s=g(2);return q(s.abrirTurno())}),i(9,"mat-icon"),n(10,"lock_open"),t(),n(11," Abrir turno de caja "),t()()}}function st(l,o){l&1&&(i(0,"div",30)(1,"mat-icon"),n(2,"swap_horiz"),t(),i(3,"p"),n(4,"Sin movimientos manuales en este turno"),t()())}function pt(l,o){if(l&1&&(i(0,"div",32)(1,"mat-icon"),n(2),t(),i(3,"div",33)(4,"span",34),n(5),t(),i(6,"span",35),n(7),p(8,"date"),t()(),i(9,"span",36),n(10),p(11,"number"),t()()),l&2){let e=o.$implicit,r=g(4);a(),b("icono-entrada",e.tipo==="entrada")("icono-salida",e.tipo==="salida"),a(),c(" ",r.getIconoMovimiento(e.tipo)," "),a(3),M(e.motivo),a(2),y(" ",m(8,14,e.created_at,"h:mm a")," \xB7 ",(e.usuario==null?null:e.usuario.nombreCompleto)??"\u2014"," "),a(2),b("monto-entrada",e.tipo==="entrada")("monto-salida",e.tipo==="salida"),a(),y(" ",e.tipo==="entrada"?"+":"\u2212"," $",m(11,17,e.monto,"1.2-2")," ")}}function mt(l,o){if(l&1&&(i(0,"div",31),ee(1,pt,12,20,"div",32,Ne),t()),l&2){let e=g();a(),te(e.movimientos)}}function gt(l,o){if(l&1){let e=ie();i(0,"div",9)(1,"div",12)(2,"div",13)(3,"span",14),C(4,"span",15),n(5," Turno abierto "),t(),i(6,"h1"),n(7,"Caja en curso"),t(),i(8,"p",16),n(9),p(10,"date"),t()(),i(11,"button",17),x("click",function(){N(e);let s=g(2);return q(s.abrirCerrarTurno())}),i(12,"mat-icon"),n(13,"lock"),t(),n(14," Cerrar turno "),t()(),i(15,"div",18)(16,"div",19)(17,"mat-icon"),n(18,"payments"),t(),i(19,"div")(20,"span",20),n(21,"Efectivo esperado"),t(),i(22,"span",21),n(23),p(24,"number"),t()()(),i(25,"div",22)(26,"mat-icon"),n(27,"point_of_sale"),t(),i(28,"div")(29,"span",20),n(30,"Ventas totales"),t(),i(31,"span",21),n(32),p(33,"number"),t()()(),i(34,"div",22)(35,"mat-icon"),n(36,"receipt_long"),t(),i(37,"div")(38,"span",20),n(39,"\xD3rdenes"),t(),i(40,"span",21),n(41),t()()(),i(42,"div",22)(43,"mat-icon"),n(44,"credit_card"),t(),i(45,"div")(46,"span",20),n(47,"Tarjeta"),t(),i(48,"span",21),n(49),p(50,"number"),t()()(),i(51,"div",22)(52,"mat-icon"),n(53,"account_balance"),t(),i(54,"div")(55,"span",20),n(56,"Transferencia"),t(),i(57,"span",21),n(58),p(59,"number"),t()()(),i(60,"div",22)(61,"mat-icon"),n(62,"volunteer_activism"),t(),i(63,"div")(64,"span",20),n(65,"Propinas"),t(),i(66,"span",21),n(67),p(68,"number"),t()()()(),i(69,"div",23)(70,"div",24)(71,"span"),n(72,"Fondo inicial"),t(),i(73,"span"),n(74),p(75,"number"),t()(),i(76,"div",24)(77,"span"),n(78,"+ Ventas en efectivo"),t(),i(79,"span"),n(80),p(81,"number"),t()(),i(82,"div",25)(83,"span"),n(84,"+ Entradas de caja"),t(),i(85,"span"),n(86),p(87,"number"),t()(),i(88,"div",26)(89,"span"),n(90,"\u2212 Salidas de caja"),t(),i(91,"span"),n(92),p(93,"number"),t()(),i(94,"div",27)(95,"span"),n(96,"Efectivo esperado"),t(),i(97,"span"),n(98),p(99,"number"),t()()(),i(100,"div",28)(101,"div",29)(102,"h2"),n(103,"Movimientos de caja"),t(),i(104,"button",2),x("click",function(){N(e);let s=g(2);return q(s.abrirMovimiento())}),i(105,"mat-icon"),n(106,"add"),t(),n(107," Nuevo movimiento "),t()(),u(108,st,5,0,"div",30)(109,mt,3,0,"div",31),t()()}if(l&2){let e=o;a(9),y(" Desde ",m(10,14,e.hora_apertura,"d MMM, h:mm a")," \xB7 ",(e.usuarioApertura==null?null:e.usuarioApertura.nombreCompleto)??"\u2014"," "),a(14),c(" $",m(24,17,e.efectivo_esperado??0,"1.2-2")," "),a(9),c(" $",m(33,20,(e.metricas_en_vivo==null?null:e.metricas_en_vivo.total_ventas)??0,"1.2-2")," "),a(9),c(" ",(e.metricas_en_vivo==null?null:e.metricas_en_vivo.total_ordenes)??0," "),a(8),c(" $",m(50,23,(e.metricas_en_vivo==null?null:e.metricas_en_vivo.total_tarjeta)??0,"1.2-2")," "),a(9),c(" $",m(59,26,(e.metricas_en_vivo==null?null:e.metricas_en_vivo.total_transferencia)??0,"1.2-2")," "),a(9),c(" $",m(68,29,(e.metricas_en_vivo==null?null:e.metricas_en_vivo.total_propinas)??0,"1.2-2")," "),a(7),c(" $",m(75,32,e.fondo_inicial,"1.2-2")," "),a(6),c(" $",m(81,35,(e.metricas_en_vivo==null?null:e.metricas_en_vivo.total_efectivo)??0,"1.2-2")," "),a(6),c(" $",m(87,38,e.total_entradas_caja??0,"1.2-2")," "),a(6),c(" $",m(93,41,e.total_salidas_caja??0,"1.2-2")," "),a(6),c(" $",m(99,44,e.efectivo_esperado??0,"1.2-2")," "),a(10),f(((e.movimientos==null?null:e.movimientos.length)??0)===0?108:109)}}function ut(l,o){if(l&1&&(u(0,ct,12,0,"div",8),u(1,gt,110,47,"div",9)),l&2){let e,r=g();f(r.turno()?-1:0),a(),f((e=r.turno())?1:-1,e)}}function ft(l,o){l&1&&(i(0,"div",6),C(1,"mat-spinner",7),t()),l&2&&(a(),h("diameter",32))}function xt(l,o){if(l&1&&(i(0,"span"),n(1),p(2,"number"),t()),l&2){let e=g().$implicit,r=g(2);Ce(r.getColorDiferencia(e.diferencia)),a(),y(" ",+e.diferencia>0?"+":""," $",m(2,4,e.diferencia,"1.2-2")," ")}}function vt(l,o){l&1&&(i(0,"span",51),n(1,"Sin arqueo"),t())}function _t(l,o){if(l&1){let e=ie();i(0,"div",41),x("click",function(){let s=N(e).$implicit,d=g(2);return q(d.verDetalle(s))}),i(1,"div",42)(2,"mat-icon"),n(3),t()(),i(4,"div",43)(5,"span",44),n(6),p(7,"date"),t(),i(8,"span",45),n(9),t()(),i(10,"div",46)(11,"span",47),n(12),p(13,"number"),t(),i(14,"span",48),n(15),t()(),i(16,"div",49),u(17,xt,3,7,"span",50)(18,vt,2,0,"span",51),t(),i(19,"mat-icon",52),n(20,"chevron_right"),t(),i(21,"button",53),x("click",function(s){let d=N(e).$implicit;return g(2).imprimirTicketTurno(d),q(s.stopPropagation())}),i(22,"mat-icon"),n(23,"print"),t()()()}if(l&2){let e=o.$implicit,r=g(2);a(),b("estado-abierto",e.estatus==="abierto")("estado-cerrado",e.estatus==="cerrado"),a(2),c(" ",e.estatus==="abierto"?"lock_open":"lock"," "),a(3),c(" ",m(7,11,e.hora_apertura,"d MMM y, h:mm a")," "),a(3),y(" ",(e.usuarioApertura==null?null:e.usuarioApertura.nombreCompleto)??"\u2014"," \xB7 ",r.formatDuracion(e.duracion_minutos??0)," "),a(3),c(" $",m(13,14,e.total_ventas,"1.2-2")," "),a(3),c(" ",e.total_ordenes," \xF3rdenes "),a(2),f(e.diferencia!==null?17:18)}}function Ct(l,o){l&1&&(i(0,"div",39)(1,"mat-icon"),n(2,"history"),t(),i(3,"p"),n(4,"No hay turnos registrados a\xFAn"),t()())}function ht(l,o){if(l&1){let e=ie();i(0,"div",37),ee(1,_t,24,17,"div",38,Ne,!1,Ct,5,0,"div",39),t(),i(4,"mat-paginator",40),x("page",function(s){N(e);let d=g();return q(d.onPageHist(s))}),t()}if(l&2){let e=g();a(),te(e.historial()),a(3),h("length",e.totalHist())("pageSize",e.perPage)("pageIndex",e.paginaHist()-1)}}var Be=class l{service=_($);turnoEstado=_(Ee);dialog=_(Me);snackBar=_(je);turno=v(null);cargando=v(!0);historial=v([]);cargandoHist=v(!1);totalHist=v(0);paginaHist=v(1);perPage=10;intervalId;ngOnInit(){this.cargar(),this.cargarHistorial(),this.intervalId=setInterval(()=>this.cargar(!0),2e4)}ngOnDestroy(){this.intervalId&&clearInterval(this.intervalId)}cargar(o=!1){o||this.cargando.set(!0),this.service.getActual().subscribe({next:e=>{this.turno.set(e.data),this.cargando.set(!1)},error:()=>this.cargando.set(!1)})}abrirTurno(){this.dialog.open(de,{width:"420px",maxWidth:"95vw"}).afterClosed().subscribe(e=>{e&&(this.turno.set(e),this.turnoEstado.refrescar(),this.mostrarToast("Turno abierto correctamente"),this.cargar(),this.cargarHistorial())})}abrirMovimiento(){this.dialog.open(ue,{width:"420px",maxWidth:"95vw"}).afterClosed().subscribe(e=>{e&&(this.mostrarToast("Movimiento registrado"),this.cargar())})}abrirCerrarTurno(){let o=this.turno();if(!o)return;this.dialog.open(fe,{width:"460px",maxWidth:"95vw",data:{turno:o}}).afterClosed().subscribe(r=>{r&&(this.turno.set(null),this.turnoEstado.refrescar(),this.mostrarToast("Turno cerrado correctamente"),this.cargar(),this.cargarHistorial())})}cargarHistorial(){this.cargandoHist.set(!0),this.service.getHistorial({page:this.paginaHist(),per_page:this.perPage}).subscribe({next:o=>{this.historial.set(o.data??[]),this.totalHist.set(o.total??0),this.cargandoHist.set(!1)},error:()=>this.cargandoHist.set(!1)})}onPageHist(o){this.paginaHist.set(o.pageIndex+1),this.cargarHistorial()}verDetalle(o){this.dialog.open(xe,{width:"580px",maxWidth:"95vw",maxHeight:"90vh",data:{turnoId:o.id}})}getColorDiferencia(o){if(!o)return"";let e=parseFloat(o);return e>0?"texto-sobrante":e<0?"texto-faltante":"texto-cuadrado"}formatDuracion(o){if(!o)return"\u2014";let e=Math.floor(o/60),r=o%60;return e>0?`${e}h ${r}m`:`${r} min`}getIconoMovimiento(o){return o==="entrada"?"add_circle":"remove_circle"}imprimirTicketTurno(o){this.service.getTicketTurno(o.id).subscribe({next:e=>this.abrirTicketTurnoHTML(e.data),error:()=>this.mostrarToast("Error al generar el ticket",!0)})}imprimirTicketDia(){let o=new Date().toISOString().split("T")[0];this.service.getTicketDia(o).subscribe({next:e=>this.abrirTicketDiaHTML(e.data),error:()=>this.mostrarToast("Error al generar el ticket del d\xEDa",!0)})}abrirVentana(o){let e=window.open("","_blank","width=420,height=700");if(!e){this.mostrarToast("Permite ventanas emergentes para imprimir",!0);return}e.document.write(o),e.document.close()}estilosTicket(){return`
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          color: #1A1A11;
          width: 80mm;
          margin: 0 auto;
          padding: 8px 6px;
          background: white;
        }
        .t-header {
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 2px solid #1A1A11;
          margin-bottom: 8px;
        }
        .t-empresa {
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 2px;
        }
        .t-direccion {
          font-size: 10px;
          color: #555;
          margin-bottom: 4px;
        }
        .t-titulo {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 4px 0;
        }
        .t-subtitulo {
          font-size: 10px;
          color: #555;
        }
        .t-sep {
          border: none;
          border-top: 1px dashed #1A1A11;
          margin: 6px 0;
        }
        .t-sep-solid {
          border: none;
          border-top: 1px solid #1A1A11;
          margin: 6px 0;
        }
        .t-fila {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 11px;
        }
        .t-fila--bold {
          font-weight: 700;
          font-size: 12px;
        }
        .t-fila--total {
          font-weight: 900;
          font-size: 14px;
          padding: 4px 0;
        }
        .t-seccion {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #555;
          margin: 6px 0 3px;
        }
        .t-arqueo {
          text-align: center;
          padding: 6px;
          border: 1px solid #1A1A11;
          border-radius: 4px;
          margin: 6px 0;
          font-weight: 700;
          font-size: 13px;
        }
        .t-arqueo--ok      { border-color: #16a34a; color: #16a34a; }
        .t-arqueo--sobre   { border-color: #2563eb; color: #2563eb; }
        .t-arqueo--faltante{ border-color: #dc2626; color: #dc2626; }
        .t-mov {
          display: flex;
          justify-content: space-between;
          padding: 1px 0;
          font-size: 10px;
        }
        .t-mov-entrada { color: #16a34a; }
        .t-mov-salida  { color: #dc2626; }
        .t-turno-header {
          background: #1A1A11;
          color: white;
          padding: 3px 6px;
          font-size: 11px;
          font-weight: 700;
          margin: 6px 0 3px;
        }
        .t-footer {
          text-align: center;
          margin-top: 10px;
          padding-top: 8px;
          border-top: 2px dashed #1A1A11;
          font-size: 10px;
          color: #777;
        }
        @media print {
          body { width: 80mm; padding: 0; }
        }
      </style>
    `}formatMoney(o){return"$"+Number(o||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",")}formatHora(o){return o?new Date(o).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit",hour12:!0}):"\u2014"}formatFechaCompleta(o){return o?new Date(o).toLocaleDateString("es-MX",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}):"\u2014"}getArqueoClass(o){let e=Number(o??0);return e>0?"t-arqueo--sobre":e<0?"t-arqueo--faltante":"t-arqueo--ok"}getArqueoLabel(o){let e=Number(o??0);return e>0?`SOBRANTE: ${this.formatMoney(e)}`:e<0?`FALTANTE: ${this.formatMoney(Math.abs(e))}`:"CAJA CUADRADA \u2713"}htmlSeccionTurno(o){let e=o.movimientos??[],r=e.length>0?e.map(s=>`
          <div class="t-mov">
            <span class="${s.tipo==="entrada"?"t-mov-entrada":"t-mov-salida"}">
              ${s.tipo==="entrada"?"\u25B2":"\u25BC"}
              ${s.motivo}
            </span>
            <span class="${s.tipo==="entrada"?"t-mov-entrada":"t-mov-salida"}">
              ${s.tipo==="entrada"?"+":"\u2212"}
              ${this.formatMoney(s.monto)}
            </span>
          </div>
        `).join(""):'<div class="t-mov" style="color:#999">Sin movimientos</div>';return`
      <div class="t-fila">
        <span>Apertura</span>
        <span>${this.formatHora(o.hora_apertura)}</span>
      </div>
      <div class="t-fila">
        <span>Cierre</span>
        <span>${o.hora_cierre?this.formatHora(o.hora_cierre):"Abierto"}</span>
      </div>
      <div class="t-fila">
        <span>Duraci\xF3n</span>
        <span>${this.formatDuracion(o.duracion_minutos??0)}</span>
      </div>
      <div class="t-fila">
        <span>Cajero</span>
        <span>${o.usuarioApertura?.nombreCompleto??"\u2014"}</span>
      </div>
      <hr class="t-sep">

      <div class="t-seccion">Ventas del turno</div>
      <div class="t-fila">
        <span>Efectivo</span>
        <span>${this.formatMoney(o.total_efectivo)}</span>
      </div>
      <div class="t-fila">
        <span>Tarjeta</span>
        <span>${this.formatMoney(o.total_tarjeta)}</span>
      </div>
      <div class="t-fila">
        <span>Transferencia</span>
        <span>${this.formatMoney(o.total_transferencia)}</span>
      </div>
      <div class="t-fila">
        <span>Propinas</span>
        <span>${this.formatMoney(o.total_propinas)}</span>
      </div>
      <div class="t-fila t-fila--bold">
        <span>Total ventas</span>
        <span>${this.formatMoney(o.total_ventas)}</span>
      </div>
      <div class="t-fila" style="font-size:10px;color:#555">
        <span>${o.total_ordenes} \xF3rdenes \xB7 ${o.ordenes_canceladas} canceladas</span>
      </div>
      <hr class="t-sep">

      <div class="t-seccion">Arqueo de efectivo</div>
      <div class="t-fila">
        <span>Fondo inicial</span>
        <span>${this.formatMoney(o.fondo_inicial)}</span>
      </div>
      <div class="t-fila">
        <span>+ Ventas efectivo</span>
        <span>${this.formatMoney(o.total_efectivo)}</span>
      </div>
      <div class="t-fila">
        <span>+ Entradas caja</span>
        <span>${this.formatMoney(o.total_entradas_caja)}</span>
      </div>
      <div class="t-fila">
        <span>\u2212 Salidas caja</span>
        <span>${this.formatMoney(o.total_salidas_caja)}</span>
      </div>
      <div class="t-fila t-fila--bold">
        <span>Efectivo esperado</span>
        <span>${this.formatMoney(o.efectivo_esperado)}</span>
      </div>
      <div class="t-fila t-fila--bold">
        <span>Efectivo contado</span>
        <span>${this.formatMoney(o.efectivo_contado)}</span>
      </div>
      <div class="t-arqueo ${this.getArqueoClass(o.diferencia)}">
        ${this.getArqueoLabel(o.diferencia)}
      </div>

      <div class="t-seccion">Movimientos de caja</div>
      ${r}

      ${o.notas_cierre?`
        <hr class="t-sep">
        <div class="t-seccion">Notas</div>
        <div style="font-size:10px">${o.notas_cierre}</div>
      `:""}
    `}abrirTicketTurnoHTML(o){let e=o.turno,r=o.empresa,s=new Date().toLocaleString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),d=`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Corte de Turno</title>
        ${this.estilosTicket()}
      </head>
      <body>
        <div class="t-header">
          ${r.nombre?`<div class="t-empresa">${r.nombre}</div>`:""}
          ${r.direccion?`<div class="t-direccion">${r.direccion}</div>`:""}
          <div class="t-titulo">Corte de Caja</div>
          <div class="t-subtitulo">
            ${this.formatFechaCompleta(e.hora_apertura)}
          </div>
          <div class="t-subtitulo">Impreso: ${s}</div>
        </div>

        ${this.htmlSeccionTurno(e)}

        <div class="t-footer">
          Este documento no es comprobante fiscal
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;this.abrirVentana(d)}abrirTicketDiaHTML(o){let e=o.empresa,r=o.fecha,s=o.turnos??[],d=o.totales,ve=new Date().toLocaleString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),qe=s.map((ne,Ve)=>`
      <div class="t-turno-header">
        TURNO ${Ve+1}
        \u2014 ${this.formatHora(ne.hora_apertura)}
        ${ne.hora_cierre?"\u2192 "+this.formatHora(ne.hora_cierre):"(abierto)"}
      </div>
      ${this.htmlSeccionTurno(ne)}
      <hr class="t-sep">
    `).join(""),_e=Number(d.diferencia_total??0),Fe=`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Corte del D\xEDa</title>
        ${this.estilosTicket()}
      </head>
      <body>
        <div class="t-header">
          ${e.nombre?`<div class="t-empresa">${e.nombre}</div>`:""}
          ${e.direccion?`<div class="t-direccion">${e.direccion}</div>`:""}
          <div class="t-titulo">Corte del D\xEDa</div>
          <div class="t-subtitulo">
            ${this.formatFechaCompleta(r+"T12:00:00")}
          </div>
          <div class="t-subtitulo">Impreso: ${ve}</div>
        </div>

        ${qe}

        <div class="t-turno-header">RESUMEN DEL D\xCDA</div>

        <div class="t-seccion">Ventas totales</div>
        <div class="t-fila">
          <span>Efectivo</span>
          <span>${this.formatMoney(d.total_efectivo)}</span>
        </div>
        <div class="t-fila">
          <span>Tarjeta</span>
          <span>${this.formatMoney(d.total_tarjeta)}</span>
        </div>
        <div class="t-fila">
          <span>Transferencia</span>
          <span>${this.formatMoney(d.total_transferencia)}</span>
        </div>
        <div class="t-fila">
          <span>Propinas</span>
          <span>${this.formatMoney(d.total_propinas)}</span>
        </div>
        <div class="t-fila t-fila--total">
          <span>TOTAL DEL D\xCDA</span>
          <span>${this.formatMoney(d.total_ventas)}</span>
        </div>
        <div class="t-fila" style="font-size:10px;color:#555">
          <span>
            ${d.total_ordenes} \xF3rdenes \xB7
            ${d.ordenes_canceladas} canceladas
          </span>
        </div>
        <hr class="t-sep-solid">

        <div class="t-seccion">Movimientos de caja del d\xEDa</div>
        <div class="t-fila">
          <span>Total entradas</span>
          <span style="color:#16a34a">
            +${this.formatMoney(d.total_entradas_caja)}
          </span>
        </div>
        <div class="t-fila">
          <span>Total salidas</span>
          <span style="color:#dc2626">
            \u2212${this.formatMoney(d.total_salidas_caja)}
          </span>
        </div>
        <hr class="t-sep">

        <div class="t-seccion">Arqueo del d\xEDa</div>
        <div class="t-arqueo ${this.getArqueoClass(_e)}">
          ${this.getArqueoLabel(_e)}
        </div>

        <div class="t-footer">
          Este documento no es comprobante fiscal
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;this.abrirVentana(Fe)}mostrarToast(o,e=!1){this.snackBar.open(o,"Cerrar",{duration:2500,horizontalPosition:"center",verticalPosition:"top",panelClass:e?["snack-error"]:[]})}static \u0275fac=function(e){return new(e||l)};static \u0275cmp=P({type:l,selectors:[["app-turno-caja-page"]],decls:17,vars:4,consts:[[1,"turno-page"],[1,"turno-page-header"],["mat-stroked-button","",3,"click"],[1,"turno-loading"],[1,"historial-section"],[1,"historial-header"],[1,"hist-loading"],[3,"diameter"],[1,"sin-turno"],[1,"turno-activo"],[1,"sin-turno__icono"],["mat-raised-button","","color","primary",1,"btn-abrir-grande",3,"click"],[1,"turno-header"],[1,"turno-header__info"],[1,"turno-badge"],[1,"turno-badge__dot"],[1,"turno-meta"],["mat-raised-button","","color","warn",1,"btn-cerrar-turno",3,"click"],[1,"metricas-grid"],[1,"metrica-card","metrica-card--destacado"],[1,"metrica-label"],[1,"metrica-valor"],[1,"metrica-card"],[1,"desglose-fondo"],[1,"desglose-fila"],[1,"desglose-fila","desglose-fila--positivo"],[1,"desglose-fila","desglose-fila--negativo"],[1,"desglose-fila","desglose-fila--total"],[1,"movimientos-section"],[1,"movimientos-header"],[1,"movimientos-vacio"],[1,"movimientos-lista"],[1,"movimiento-item"],[1,"movimiento-info"],[1,"movimiento-motivo"],[1,"movimiento-meta"],[1,"movimiento-monto"],[1,"historial-lista"],[1,"hist-item"],[1,"hist-vacio"],["hidePageSize","","showFirstLastButtons","",3,"page","length","pageSize","pageIndex"],[1,"hist-item",3,"click"],[1,"hist-item__estado"],[1,"hist-item__info"],[1,"hist-fecha"],[1,"hist-usuario"],[1,"hist-item__ventas"],[1,"hist-total"],[1,"hist-ordenes"],[1,"hist-item__arqueo"],[3,"class"],[1,"sin-arqueo"],[1,"hist-chevron"],["mat-icon-button","","matTooltip","Imprimir ticket",3,"click"]],template:function(e,r){e&1&&(i(0,"div",0)(1,"div",1)(2,"div")(3,"h1"),n(4,"Caja"),t()(),i(5,"button",2),x("click",function(){return r.imprimirTicketDia()}),i(6,"mat-icon"),n(7,"today"),t(),n(8," Corte del d\xEDa "),t()(),u(9,dt,2,1,"div",3),u(10,ut,2,2),i(11,"div",4)(12,"div",5)(13,"h2"),n(14,"Historial de turnos"),t()(),u(15,ft,2,1,"div",6),u(16,ht,5,4),t()()),e&2&&(a(9),f(r.cargando()?9:-1),a(),f(r.cargando()?-1:10),a(5),f(r.cargandoHist()?15:-1),a(),f(r.cargandoHist()?-1:16))},dependencies:[S,j,D,I,k,le,w,A,z,ke,ye,Pe,De,we,Se,V,ae],styles:["[_nghost-%COMP%]{display:block;background:var(--color-bg-app);color:var(--color-text-primary)}.turno-page[_ngcontent-%COMP%]{padding:20px;margin:0 auto;background:var(--color-bg-app);color:var(--color-text-primary)}.turno-page-header[_ngcontent-%COMP%]{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.turno-page-header[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{font-size:22px;font-weight:800;margin:0;color:var(--color-text-primary)}.turno-loading[_ngcontent-%COMP%]{display:flex;justify-content:center;padding:80px 0}.sin-turno[_ngcontent-%COMP%]{display:flex;flex-direction:column;align-items:center;text-align:center;padding:60px 20px}.sin-turno__icono[_ngcontent-%COMP%]{width:72px;height:72px;border-radius:50%;background:#0f4d2a14;display:flex;align-items:center;justify-content:center;margin-bottom:16px}.sin-turno__icono[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:36px;width:36px;height:36px;color:#0f4d2a}.sin-turno[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{font-size:20px;font-weight:800;margin:0 0 6px;color:var(--color-text-primary)}.sin-turno[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{font-size:14px;color:var(--color-text-muted);margin:0 0 20px;max-width:320px}.btn-abrir-grande[_ngcontent-%COMP%]{height:48px;padding:0 24px;font-size:15px;display:flex;align-items:center;gap:8px}.turno-header[_ngcontent-%COMP%]{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}.turno-badge[_ngcontent-%COMP%]{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.04em}.turno-badge__dot[_ngcontent-%COMP%]{width:7px;height:7px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 3px #16a34a33}.turno-header[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{font-size:22px;font-weight:800;margin:4px 0 2px;color:var(--color-text-primary)}.turno-meta[_ngcontent-%COMP%]{font-size:13px;color:var(--color-text-muted);margin:0}.btn-cerrar-turno[_ngcontent-%COMP%]{flex-shrink:0}.metricas-grid[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:18px}.metrica-card[_ngcontent-%COMP%]{display:flex;align-items:center;gap:10px;background:var(--color-bg-surface);border:1.5px solid var(--color-border);border-radius:12px;padding:14px}.metrica-card--destacado[_ngcontent-%COMP%]{background:#0f4d2a;border-color:#0f4d2a}.metrica-card--destacado[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:#fff}.metrica-card--destacado[_ngcontent-%COMP%]   .metrica-label[_ngcontent-%COMP%]{color:#ffffffb3}.metrica-card--destacado[_ngcontent-%COMP%]   .metrica-valor[_ngcontent-%COMP%]{color:#fff}.metrica-card[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:22px;width:22px;height:22px;color:var(--color-text-muted)}.metrica-card[_ngcontent-%COMP%]   div[_ngcontent-%COMP%]{display:flex;flex-direction:column}.metrica-label[_ngcontent-%COMP%]{font-size:11px;color:var(--color-text-muted);font-weight:600}.metrica-valor[_ngcontent-%COMP%]{font-size:17px;font-weight:800;color:var(--color-text-primary)}.desglose-fondo[_ngcontent-%COMP%]{background:var(--color-bg-surface);border:1.5px solid var(--color-border);border-radius:12px;padding:14px;margin-bottom:18px}.desglose-fila[_ngcontent-%COMP%]{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;color:var(--color-text-secondary)}.desglose-fila--positivo[_ngcontent-%COMP%]{color:#16a34a}.desglose-fila--negativo[_ngcontent-%COMP%]{color:#dc2626}.desglose-fila--total[_ngcontent-%COMP%]{border-top:1.5px solid var(--color-border);margin-top:6px;padding-top:10px;font-weight:800;font-size:15px;color:#0f4d2a}.movimientos-section[_ngcontent-%COMP%]{background:var(--color-bg-surface);border:1.5px solid var(--color-border);border-radius:12px;padding:14px}.movimientos-header[_ngcontent-%COMP%]{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.movimientos-header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{font-size:15px;font-weight:700;margin:0;color:var(--color-text-primary)}.movimientos-vacio[_ngcontent-%COMP%]{display:flex;flex-direction:column;align-items:center;padding:30px 0;color:var(--color-text-faint)}.movimientos-vacio[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:32px;width:32px;height:32px;margin-bottom:6px}.movimientos-lista[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:6px}.movimiento-item[_ngcontent-%COMP%]{display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;background:var(--color-bg-surface-2)}.movimiento-item[_ngcontent-%COMP%]   .icono-entrada[_ngcontent-%COMP%]{color:#16a34a}.movimiento-item[_ngcontent-%COMP%]   .icono-salida[_ngcontent-%COMP%]{color:#dc2626}.movimiento-info[_ngcontent-%COMP%]{display:flex;flex-direction:column;flex:1;min-width:0}.movimiento-motivo[_ngcontent-%COMP%]{font-size:13px;font-weight:600;color:var(--color-text-primary)}.movimiento-meta[_ngcontent-%COMP%]{font-size:11px;color:var(--color-text-faint)}.movimiento-monto[_ngcontent-%COMP%]{font-size:14px;font-weight:800}.movimiento-monto.monto-entrada[_ngcontent-%COMP%]{color:#16a34a}.movimiento-monto.monto-salida[_ngcontent-%COMP%]{color:#dc2626}.historial-section[_ngcontent-%COMP%]{margin-top:28px;background:var(--color-bg-surface);border:1.5px solid var(--color-border);border-radius:14px;overflow:hidden}.historial-header[_ngcontent-%COMP%]{padding:14px 16px;border-bottom:1px solid var(--color-border)}.historial-header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{font-size:15px;font-weight:700;margin:0;color:var(--color-text-primary)}.hist-loading[_ngcontent-%COMP%]{display:flex;justify-content:center;padding:30px}.historial-lista[_ngcontent-%COMP%]{display:flex;flex-direction:column}.hist-item[_ngcontent-%COMP%]{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f3f4f6;cursor:pointer;transition:background .1s}.hist-item[_ngcontent-%COMP%]:hover{background:var(--color-bg-surface-2)}.hist-item[_ngcontent-%COMP%]:last-child{border-bottom:none}.hist-item__estado[_ngcontent-%COMP%]{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.hist-item__estado[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:18px;width:18px;height:18px}.hist-item__estado.estado-abierto[_ngcontent-%COMP%]{background:#16a34a1a}.hist-item__estado.estado-abierto[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:#16a34a}.hist-item__estado.estado-cerrado[_ngcontent-%COMP%]{background:#6b72801a}.hist-item__estado.estado-cerrado[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:var(--color-text-muted)}.hist-item__info[_ngcontent-%COMP%]{display:flex;flex-direction:column;flex:1;min-width:0}.hist-fecha[_ngcontent-%COMP%]{font-size:13px;font-weight:600;color:var(--color-text-primary)}.hist-usuario[_ngcontent-%COMP%]{font-size:11px;color:var(--color-text-faint)}.hist-item__ventas[_ngcontent-%COMP%]{display:flex;flex-direction:column;align-items:flex-end;flex-shrink:0}.hist-total[_ngcontent-%COMP%]{font-size:14px;font-weight:800;color:var(--color-text-primary)}.hist-ordenes[_ngcontent-%COMP%]{font-size:11px;color:var(--color-text-faint)}.hist-item__arqueo[_ngcontent-%COMP%]{min-width:80px;text-align:right;font-size:13px;font-weight:700;flex-shrink:0}.hist-chevron[_ngcontent-%COMP%]{color:#d1d5db;font-size:18px;width:18px;height:18px;flex-shrink:0}.texto-sobrante[_ngcontent-%COMP%]{color:#2563eb}.texto-faltante[_ngcontent-%COMP%]{color:#dc2626}.texto-cuadrado[_ngcontent-%COMP%]{color:#16a34a}.sin-arqueo[_ngcontent-%COMP%]{color:var(--color-text-faint);font-size:11px}.hist-vacio[_ngcontent-%COMP%]{display:flex;flex-direction:column;align-items:center;padding:40px 20px;color:var(--color-text-faint)}.hist-vacio[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:36px;width:36px;height:36px;margin-bottom:8px}.hist-vacio[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{margin:0;font-size:14px}"]})};export{Be as TurnoCajaPageComponent};
