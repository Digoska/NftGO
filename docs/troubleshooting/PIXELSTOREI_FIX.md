# Fix pre EXGL: gl.pixelStorei() Warning

## 🔴 Problém

```
EXGL: gl.pixelStorei() doesn't support this parameter yet!
```

Tento warning prichádza z three.js kvôli volaniam `gl.pixelStorei` pre:
- `Texture.flipY` (UNPACK_FLIP_Y_WEBGL) - **podporované**
- `Texture.unpackAlignment` - **nepodporované v expo-gl**

## ✅ Riešenie

Workaround z GitHub issue: https://github.com/pmndrs/react-three-fiber/issues/2574

**Čo robíme:**
- Prepíšeme `gl.pixelStorei` funkciu
- Povolíme len `UNPACK_FLIP_Y_WEBGL` parameter
- Ostatné parametre ignorujeme (bez warningu)

## 📝 Implementácia

```typescript
// V onGLContextCreate funkcii
if (gl && gl.pixelStorei) {
  const pixelStorei = gl.pixelStorei.bind(gl);
  gl.pixelStorei = function(...args: any[]) {
    const [parameter] = args;
    
    // Only allow UNPACK_FLIP_Y_WEBGL - all else is unimplemented in expo-gl
    if (parameter === gl.UNPACK_FLIP_Y_WEBGL) {
      return pixelStorei(...args);
    }
    // Silently ignore other parameters to prevent warnings
  };
}
```

## ✅ Výsledok

- ✅ Warning `EXGL: gl.pixelStorei() doesn't support this parameter yet!` je odstránený
- ✅ Model sa stále renderuje správne
- ✅ Textúry s `flipY` fungujú

## ⚠️ Dôležité

**Toto NERIEŠI problém s embedded textúrami v GLB!**

- ✅ Odstráni warnings
- ✅ Model sa renderuje
- ❌ Embedded textúry v GLB stále nefungujú (Blob API problém)

**Pre embedded textúry v GLB:**
- Použiť GLTF formát (externé textúry)
- Alebo WebView riešenie

## 📚 Zdroj

GitHub Issue: https://github.com/pmndrs/react-three-fiber/issues/2574

**Komentár od CodyJasonBennett:**
> "That warning comes from three with calls to gl.pixelStorei for handling Texture.flipY or Texture.unpackAlignment for data textures. The latter parameter is unimplemented in expo-gl, so I'm afraid there isn't much we can do here without a champion downstream."

**Workaround:**
> "If you want to hack expo-gl or three around this warning, you could overwrite gl.pixelStorei to only handle the gl.UNPACK_FLIP_Y_WEBGL parameter -- all else is unimplemented and will warn."



