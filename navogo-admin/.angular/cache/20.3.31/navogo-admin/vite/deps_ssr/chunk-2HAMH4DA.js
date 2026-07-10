import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  MatRipple
} from "./chunk-4USVVV37.js";
import {
  MatCommonModule
} from "./chunk-E33IUIG6.js";
import {
  NgModule,
  setClassMetadata,
  ɵɵdefineNgModule
} from "./chunk-UBWSCTSF.js";
import {
  ɵɵdefineInjector
} from "./chunk-ZMYHUZBX.js";

// node_modules/@angular/material/fesm2022/ripple-module.mjs
var MatRippleModule = class _MatRippleModule {
  static ɵfac = function MatRippleModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatRippleModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MatRippleModule,
    imports: [MatCommonModule, MatRipple],
    exports: [MatRipple, MatCommonModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [MatCommonModule, MatCommonModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatRippleModule, [{
    type: NgModule,
    args: [{
      imports: [MatCommonModule, MatRipple],
      exports: [MatRipple, MatCommonModule]
    }]
  }], null, null);
})();

export {
  MatRippleModule
};
//# sourceMappingURL=chunk-2HAMH4DA.js.map
