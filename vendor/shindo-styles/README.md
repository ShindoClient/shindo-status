# Shindo Styles - Cópia Local

Esta é uma cópia local da biblioteca `@shindo/styles` para uso no projeto.

## 📝 Como Atualizar

Quando houver mudanças no projeto `shindo-styles` principal, atualize esta cópia:

```bash
# A partir da raiz do projeto SHINDO
cd INFRESTRUTURA/shindo-status
rm -rf vendor/shindo-styles/src
rm vendor/shindo-styles/package.json

# Copiar do projeto principal
cp -r ../../../shindo-styles/src vendor/shindo-styles/
cp ../../../shindo-styles/package.json vendor/shindo-styles/
```

Ou no PowerShell:

```powershell
cd E:\UTIL\Projects\SHINDO\INFRESTRUTURA\shindo-status
Remove-Item -Recurse -Force vendor\shindo-styles\src
Remove-Item vendor\shindo-styles\package.json

cd E:\UTIL\Projects\SHINDO
Copy-Item -Recurse -Force shindo-styles\src INFRESTRUTURA\shindo-status\vendor\shindo-styles\
Copy-Item shindo-styles\package.json INFRESTRUTURA\shindo-status\vendor\shindo-styles\
```

## ⚠️ Importante

- Esta cópia é commitada no repositório para facilitar o deploy
- Mantenha esta cópia sincronizada com o projeto principal `shindo-styles`
- O `package.json` do projeto aponta para `file:./vendor/shindo-styles`
