#!/bin/bash
find dist/navogo-admin/browser -name "chunk-*.js" -size 0 | while read f; do
  nombre=$(basename "$f")
  sed -i '' "s|<script src=\"$nombre\" type=\"module\"></script>||g" dist/navogo-admin/browser/index.html
  for js in dist/navogo-admin/browser/*.js; do
    sed -i '' "s|import\"\./$nombre\";||g" "$js"
  done
  rm "$f"
  echo "Eliminado chunk vacío: $nombre"
done
echo "✅ Listo para subir"
