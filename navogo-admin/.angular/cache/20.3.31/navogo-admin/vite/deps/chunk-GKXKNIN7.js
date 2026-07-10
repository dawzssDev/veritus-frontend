import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-LOQAG7C5.js";
import {
  MatCommonModule,
  ObserversModule
} from "./chunk-XJIYCFKV.js";
import {
  NgModule,
  setClassMetadata,
  ɵɵdefineNgModule
} from "./chunk-6ZB2BPTH.js";
import {
  ɵɵdefineInjector
} from "./chunk-P7SIV3KW.js";

// node_modules/@angular/material/fesm2022/form-field-module.mjs
var MatFormFieldModule = class _MatFormFieldModule {
  static ɵfac = function MatFormFieldModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatFormFieldModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MatFormFieldModule,
    imports: [MatCommonModule, ObserversModule, MatFormField, MatLabel, MatError, MatHint, MatPrefix, MatSuffix],
    exports: [MatFormField, MatLabel, MatHint, MatError, MatPrefix, MatSuffix, MatCommonModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [MatCommonModule, ObserversModule, MatFormField, MatCommonModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatFormFieldModule, [{
    type: NgModule,
    args: [{
      imports: [MatCommonModule, ObserversModule, MatFormField, MatLabel, MatError, MatHint, MatPrefix, MatSuffix],
      exports: [MatFormField, MatLabel, MatHint, MatError, MatPrefix, MatSuffix, MatCommonModule]
    }]
  }], null, null);
})();

export {
  MatFormFieldModule
};
//# sourceMappingURL=chunk-GKXKNIN7.js.map
