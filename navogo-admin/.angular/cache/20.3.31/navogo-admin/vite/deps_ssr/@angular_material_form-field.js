import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  MatFormFieldModule
} from "./chunk-CXPLHIOH.js";
import {
  MAT_ERROR,
  MAT_FORM_FIELD,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MAT_PREFIX,
  MAT_SUFFIX,
  MatError,
  MatFormField,
  MatFormFieldControl,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix,
  getMatFormFieldDuplicatedHintError,
  getMatFormFieldMissingControlError,
  getMatFormFieldPlaceholderConflictError
} from "./chunk-IMUG3S4N.js";
import "./chunk-GZR4MR4V.js";
import "./chunk-5J64DKEU.js";
import "./chunk-5XYFHA5V.js";
import "./chunk-WMCF36ZG.js";
import "./chunk-WXMSZRL6.js";
import "./chunk-E33IUIG6.js";
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

// node_modules/@angular/material/fesm2022/form-field.mjs
var import_rxjs = __toESM(require_cjs(), 1);
var import_operators = __toESM(require_operators(), 1);
var matFormFieldAnimations = {
  // Represents:
  // trigger('transitionMessages', [
  //   // TODO(mmalerba): Use angular animations for label animation as well.
  //   state('enter', style({opacity: 1, transform: 'translateY(0%)'})),
  //   transition('void => enter', [
  //     style({opacity: 0, transform: 'translateY(-5px)'}),
  //     animate('300ms cubic-bezier(0.55, 0, 0.55, 0.2)'),
  //   ]),
  // ])
  /** Animation that transitions the form field's error and hint messages. */
  transitionMessages: {
    type: 7,
    name: "transitionMessages",
    definitions: [
      {
        type: 0,
        name: "enter",
        styles: {
          type: 6,
          styles: { opacity: 1, transform: "translateY(0%)" },
          offset: null
        }
      },
      {
        type: 1,
        expr: "void => enter",
        animation: [
          { type: 6, styles: { opacity: 0, transform: "translateY(-5px)" }, offset: null },
          { type: 4, styles: null, timings: "300ms cubic-bezier(0.55, 0, 0.55, 0.2)" }
        ],
        options: null
      }
    ],
    options: {}
  }
};
export {
  MAT_ERROR,
  MAT_FORM_FIELD,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MAT_PREFIX,
  MAT_SUFFIX,
  MatError,
  MatFormField,
  MatFormFieldControl,
  MatFormFieldModule,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix,
  getMatFormFieldDuplicatedHintError,
  getMatFormFieldMissingControlError,
  getMatFormFieldPlaceholderConflictError,
  matFormFieldAnimations
};
//# sourceMappingURL=@angular_material_form-field.js.map
