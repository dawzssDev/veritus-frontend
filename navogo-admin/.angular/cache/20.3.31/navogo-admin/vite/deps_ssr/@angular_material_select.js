import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-OUJEHURS.js";
import "./chunk-PMJLF6FV.js";
import "./chunk-CXPLHIOH.js";
import "./chunk-CZ26DZQM.js";
import "./chunk-ENS4BP6D.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-UVZZOPT6.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-IMUG3S4N.js";
import "./chunk-GZR4MR4V.js";
import "./chunk-NXV5VZ6A.js";
import "./chunk-2HAMH4DA.js";
import "./chunk-OO3VHDAP.js";
import "./chunk-4USVVV37.js";
import "./chunk-BWOWA2IH.js";
import "./chunk-5J64DKEU.js";
import "./chunk-5XYFHA5V.js";
import "./chunk-WMCF36ZG.js";
import "./chunk-WXMSZRL6.js";
import "./chunk-E33IUIG6.js";
import "./chunk-EIHTYSMT.js";
import "./chunk-AW5BJYQ4.js";
import "./chunk-4NRDWZRV.js";
import "./chunk-4GVG5X4N.js";
import "./chunk-BN4I422C.js";
import "./chunk-2JCKFGSA.js";
import "./chunk-UJQIVWSY.js";
import "./chunk-47WBPA2L.js";
import "./chunk-XTNIOMTS.js";
import "./chunk-UBWSCTSF.js";
import "./chunk-ZMYHUZBX.js";
import {
  require_operators
} from "./chunk-KTQEUXG5.js";
import {
  require_cjs
} from "./chunk-5J6XMCTS.js";
import "./chunk-S6HF3TWB.js";
import {
  __toESM
} from "./chunk-UUWW2VJQ.js";

// node_modules/@angular/material/fesm2022/select.mjs
var import_rxjs = __toESM(require_cjs(), 1);
var import_operators = __toESM(require_operators(), 1);
var matSelectAnimations = {
  // Represents
  // trigger('transformPanel', [
  //   state(
  //     'void',
  //     style({
  //       opacity: 0,
  //       transform: 'scale(1, 0.8)',
  //     }),
  //   ),
  //   transition(
  //     'void => showing',
  //     animate(
  //       '120ms cubic-bezier(0, 0, 0.2, 1)',
  //       style({
  //         opacity: 1,
  //         transform: 'scale(1, 1)',
  //       }),
  //     ),
  //   ),
  //   transition('* => void', animate('100ms linear', style({opacity: 0}))),
  // ])
  /** This animation transforms the select's overlay panel on and off the page. */
  transformPanel: {
    type: 7,
    name: "transformPanel",
    definitions: [
      {
        type: 0,
        name: "void",
        styles: {
          type: 6,
          styles: { opacity: 0, transform: "scale(1, 0.8)" },
          offset: null
        }
      },
      {
        type: 1,
        expr: "void => showing",
        animation: {
          type: 4,
          styles: {
            type: 6,
            styles: { opacity: 1, transform: "scale(1, 1)" },
            offset: null
          },
          timings: "120ms cubic-bezier(0, 0, 0.2, 1)"
        },
        options: null
      },
      {
        type: 1,
        expr: "* => void",
        animation: {
          type: 4,
          styles: { type: 6, styles: { opacity: 0 }, offset: null },
          timings: "100ms linear"
        },
        options: null
      }
    ],
    options: {}
  }
};
export {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatOptgroup,
  MatOption,
  MatPrefix,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger,
  MatSuffix,
  matSelectAnimations
};
//# sourceMappingURL=@angular_material_select.js.map
